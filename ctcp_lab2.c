/******************************************************************************
 * ctcp.c
 * ------
 * Implementation of cTCP done here. This is the only file you need to change.
 * Look at the following files for references and useful functions:
 *   - ctcp.h: Headers for this file.
 *   - ctcp_iinked_list.h: Linked list functions for managing a linked list.
 *   - ctcp_sys.h: Connection-related structs and functions, cTCP segment
 *                 definition.
 *   - ctcp_utils.h: Checksum computation, getting the current time.
 *
 *****************************************************************************/

#include "ctcp.h"
#include "ctcp_linked_list.h"
#include "ctcp_sys.h"
#include "ctcp_utils.h"

typedef struct {
    bool is_EOF;
    uint32_t last_ackno_rxed;
    uint32_t last_seqno_read;
    uint32_t last_seqno_sent;
    linked_list_t *unacked_segment;
} tx_state_t;

typedef struct {
    bool is_FIN;
    uint32_t last_seqno_accepted;
    uint32_t num_truncated_segments;
    uint32_t num_out_of_window_segment;
    uint32_t num_invalid_cksums;
    linked_list_t *segment_to_output;
} rx_state_t;

typedef struct {
    uint32_t num_xmits;
    long timestam_of_last_send;
    ctcp_segment_t ctcp_segment;
} wrapped_ctcp_segment_t;
/**
 * Connection state.
 *
 * Stores per-connection information such as the current sequence number,
 * unacknowledged packets, etc.
 *
 * You should add to this to store other fields you might need.
 */
struct ctcp_state {
  struct ctcp_state *next;  /* Next in linked list */
  struct ctcp_state **prev; /* Prev in linked list */

  conn_t *conn;             /* Connection object -- needed in order to figure
                               out destination when sending */
  linked_list_t *segments;  /* Linked list of segments sent to this connection.
                               It may be useful to have multiple linked lists
                               for unacknowledged segments, segments that
                               haven't been sent, etc. Lab 1 uses the
                               stop-and-wait protocol and therefore does not
                               necessarily need a linked list. You may remove
                               this if this is the case for you */

  /* FIXME: Add other needed fields. */
  long FIN_WAIT_start_time;
  ctcp_config_t ctcp_config;
  tx_state_t tx_state;
  rx_state_t rx_state;
};

/**
 * Linked list of connection states. Go through this in ctcp_timer() to
 * resubmit segments and tear down connections.
 */
static ctcp_state_t *state_list;

static void ctcp_send(ctcp_state_t *state);
static void ctcp_send_segment(ctcp_state_t *state, wrapped_ctcp_segment_t *wrapped_segment);
static void ctcp_clean_unacked_segment_list(ctcp_state_t *state);
static void ctcp_send_control_segment(ctcp_state_t *state);
static uint16_t ctcp_get_num_data_bytes(ctcp_segment_t *ctcp_segment_ptr);

/* FIXME: Feel free to add as many helper functions as needed. Don't repeat
          code! Helper functions make the code clearer and cleaner. */


ctcp_state_t *ctcp_init(conn_t *conn, ctcp_config_t *cfg) {
  /* Connection could not be established. */
  if (conn == NULL) {
    return NULL;
  }

  /* Established a connection. Create a new state and update the linked list
     of connection states. */
  ctcp_state_t *state = calloc(sizeof(ctcp_state_t), 1);
  state->next = state_list;
  state->prev = &state_list;
  if (state_list)
    state_list->prev = &state->next;
  state_list = state;

  /* Set fields. */
  state->conn = conn;
  /* FIXME: Do any other initialization here. */
  state->FIN_WAIT_start_time = 0;
  state->ctcp_config.recv_window = cfg->recv_window;
  state->ctcp_config.send_window = cfg->send_window;
  state->ctcp_config.timer = cfg->timer;
  state->ctcp_config.rt_timeout = cfg->rt_timeout;

  state->tx_state.last_ackno_rxed = 0;
  state->tx_state.is_EOF = false;
  state->tx_state.last_seqno_read = 0;
  state->tx_state.last_seqno_sent = 0;
  state->tx_state.wrapped_unacked_segments = ll_create();

  state->rx_state.last_seqno_accepted = 0;
  state->rx_state.is_FIN = false;
  state->rx_state.num_truncated_segments = 0;
  state->rx_state.num_out_of_window_segments = 0;
  state->rx_state.num_invalid_cksums = 0;
  state->rx_state.segments_to_output = ll_create();

  free(cfg);

  return state;
}

void ctcp_destroy(ctcp_state_t *state) {
  unsigned int len;
  unsigned int i;

  /* Update linked list. */
  if (state->next)
    state->next->prev = state->prev;

  *state->prev = state->next;
  conn_remove(state->conn);

  /* FIXME: Do any other cleanup here. */
  len = ll_length(state->tx_state.wrapped_unacked_segments);

  for (i = 0; i < len; ++i)
  {
    ll_node_t *front_node_ptr = ll_front(state->tx_state.wrapped_unacked_segments);
    free(front_node_ptr->object);
    ll_remove(state->tx_state.wrapped_unacked_segments, front_node_ptr);
  }

  ll_destroy(state->tx_state.wrapped_unacked_segments);

  len = ll_length(state->rx_state.segments_to_output);

  for (i = 0; i < len; ++i)
  {
    ll_node_t *front_node_ptr = ll_front(state->rx_state.segments_to_output);
    free(front_node_ptr->object);
    ll_remove(state->rx_state.segments_to_output, front_node_ptr);
  }
  ll_destroy(state->rx_state.segments_to_output);

  free(state);

  end_client();
}

void ctcp_read(ctcp_state_t *state) {
  /* FIXME */
  int bytes_read;
  uint8_t buf[MAX_SEG_DATA_SIZE];
  wrapped_ctcp_segment_t *new_segment_ptr;

  if (state->tx_state.is_EOF)
  {
    return;
  }
  
  while ((bytes_read = conn_input(state->conn, buf, MAX_SEG_DATA_SIZE)) > 0)
  {
    new_segment_ptr = (wrapped_ctcp_segment_t*) calloc(1,
                                  sizeof(wrapped_ctcp_segment_t) + bytes_read);
    new_segment_ptr->ctcp_segment.len = htons((uint16_t) sizeof(ctcp_segment_t) + bytes_read);
    new_segment_ptr->ctcp_segment.seqno = htonl(state->tx_state.last_seqno_read + 1);
    memcpy(new_segment_ptr->ctcp_segment.data, buf, bytes_read);
    state->tx_state.last_seqno_read += bytes_read;
    ll_add(state->tx_state.wrapped_unacked_segments, new_segment_ptr);
  }

  if (bytes_read == -1)
  {
    state->tx_state.is_EOF = true;
    new_segment_ptr = (wrapped_ctcp_segment_t*) calloc(1, sizeof(wrapped_ctcp_segment_t));
    new_segment_ptr->ctcp_segment.len = htons((uint16_t) sizeof(ctcp_segment_t));
    new_segment_ptr->ctcp_segment.seqno = htonl(state->tx_state.last_seqno_read + 1);
    new_segment_ptr->ctcp_segment.flags |= TH_FIN;
    
    ll_add(state->tx_state.wrapped_unacked_segments, new_segment_ptr);
  }

  ctcp_send(state_list);
}

static void
ctcp_send(ctcp_state_t *state)
{
  wrapped_ctcp_segment_t *wrapped_ctcp_segment_ptr;
  ll_node_t *curr_node_ptr;
  long ms_since_last_send;
  unsigned int i;
  unsigned int length;
  uint32_t last_seqno_of_segment;
  uint32_t last_allowable_seqno;

  if (state == NULL)
  {
    return;
  }
  
  length = ll_length(state->tx_state.wrapped_unacked_segments);
  if (length == 0)
  {
    return;
  }

  for (i = 0; i < length; ++i) {
    if (i == 0) {
      curr_node_ptr = ll_front(state->tx_state.wrapped_unacked_segments);
    } else {
      curr_node_ptr = curr_node_ptr->next;
    }

    wrapped_ctcp_segment_ptr = (wrapped_ctcp_segment_t *) curr_node_ptr->object;

    last_seqno_of_segment = ntohl(wrapped_ctcp_segment_ptr->ctcp_segment.seqno)
      + ctcp_get_num_data_bytes(&wrapped_ctcp_segment_ptr->ctcp_segment) - 1;

    last_allowable_seqno = state->tx_state.last_ackno_rxed - 1
      + state->ctcp_config.send_window;

    if (state->tx_state.last_ackno_rxed == 0) 
    {
      last_allowable_seqno += 1;
    }

    if (last_seqno_of_segment > last_allowable_seqno) 
    {
      return;
    }

    if (wrapped_ctcp_segment_ptr->num_xmits == 0)
    {
      ctcp_send_segment(state, wrapped_ctcp_segment_ptr);
    } 
    else if (i == 0) 
    {
      // Check and see if we need to retrasnmit the first segment.
      ms_since_last_send = current_time() - wrapped_ctcp_segment_ptr->timestamp_of_last_send;
      if (ms_since_last_send > state->ctcp_config.rt_timeout) 
      {
        // Timeout. Resend the segment.
        ctcp_send_segment(state, wrapped_ctcp_segment_ptr);
      }
    }
}

static void
ctcp_send_segment(ctcp_state_t *state, wrapped_ctcp_segment_t* wrapped_segment)
{
  long timestamp;
  uint16_t segment_cksum;
  int bytes_sent;

  if (wrapped_segment->num_xmits >= MAX_NUM_XMITS) 
  {
    ctcp_destroy(state);
  }

  wrapped_segment->ctcp_segment.ackno = htonl(state->rx_state.last_seqno_accepted + 1);
  wrapped_segment->ctcp_segment.flags |= TH_ACK;
  wrapped_segment->ctcp_segment.window = htons(state->ctcp_config.recv_window);

  wrapped_segment->ctcp_segment.cksum = 0;
  segment_cksum = cksum(&wrapped_segment->ctcp_segment, ntohs(wrapped_segment->ctcp_segment.len));
  wrapped_segment->ctcp_segment.cksum = segment_cksum;

  bytes_sent = conn_send(state->conn, &wrapped_segment->ctcp_segment,
                         ntohs(wrapped_segment->ctcp_segment.len));

  timestamp = current_time();
  wrapped_segment->num_xmits++;

  if (bytes_sent < ntohs(wrapped_segment->ctcp_segment.len))
  {
    return;
  }

  if (bytes_sent == -1)
  {
    ctcp_destroy(state);
    return;
  }

  state->tx_state.last_seqno_sent += bytes_sent;
  wrapped_segment->timestamp_of_last_send = timestamp;
}

void ctcp_receive(ctcp_state_t *state, ctcp_segment_t *segment, size_t len) {
  /* FIXME */
  uint16_t computed_cksum, actual_cksum, num_data_bytes;
  uint32_t last_seqno_of_segment, largest_allowable_seqno, smallest_allowable_seqno;
  unsigned int length, i;
  ll_node_t* ll_node_ptr;
  ctcp_segment_t* ctcp_segment_ptr;

  if (len < ntohs(segment->len)) 
  {
    free(segment);
    state->rx_state.num_truncated_segments++;
    return;
  }

  actual_cksum = segment->cksum;
  segment->cksum = 0;
  computed_cksum = cksum(segment, ntohs(segment->len));

  segment->cksum = actual_cksum;

  if (actual_cksum != computed_cksum)
  {
    free(segment);
    state->rx_state.num_invalid_cksums++;
    return;
  }

  num_data_bytes = ntohs(segment->len) - sizeof(ctcp_segment_t);

  if (num_data_bytes) 
  {
    last_seqno_of_segment = ntohl(segment->seqno) + num_data_bytes - 1;
    smallest_allowable_seqno = state->rx_state.last_seqno_accepted + 1;
    largest_allowable_seqno = state->rx_state.last_seqno_accepted
      + state->ctcp_config.recv_window;

    if ((last_seqno_of_segment > largest_allowable_seqno) ||
        (ntohl(segment->seqno) < smallest_allowable_seqno)) 
    {
      free(segment);

      ctcp_send_control_segment(state);
      state->rx_state.num_out_of_window_segments++;
      return;
    }
  }

  if (segment->flags & TH_ACK) 
  {
    state->tx_state.last_ackno_rxed = ntohl(segment->ackno);
  }

  if (num_data_bytes || (segment->flags & TH_FIN))
  {
    length = ll_length(state->rx_state.segments_to_output);

    if (length == 0)
    {
      ll_add(state->rx_state.segments_to_output, segment);
    }

    else if (length == 1)
    {
      ll_node_ptr = ll_front(state->rx_state.segments_to_output);
      ctcp_segment_ptr = (ctcp_segment_t*) ll_node_ptr->object;
      if (ntohl(segment->seqno) == ntohl(ctcp_segment_ptr->seqno))
      {
        free(segment);
      }
      else if (ntohl(segment->seqno) > ntohl(ctcp_segment_ptr->seqno))
      {
        ll_add(state->rx_state.segments_to_output, segment);
      }
      else
      {
        ll_add_front(state->rx_state.segments_to_output, segment);
      }
    }
    else
    {
      ctcp_segment_t* first_ctcp_segment_ptr;
      ctcp_segment_t* last_ctcp_segment_ptr;
      ll_node_t* first_ll_node_ptr;
      ll_node_t* last_ll_node_ptr;

      first_ll_node_ptr = ll_front(state->rx_state.segments_to_output);
      last_ll_node_ptr  = ll_back(state->rx_state.segments_to_output);

      first_ctcp_segment_ptr = (ctcp_segment_t*) first_ll_node_ptr->object;
      last_ctcp_segment_ptr  = (ctcp_segment_t*) last_ll_node_ptr->object;

      if (ntohl(segment->seqno) > ntohl(last_ctcp_segment_ptr->seqno))
      {
        ll_add(state->rx_state.segments_to_output, segment);
      }
      else if (ntohl(segment->seqno) < ntohl(first_ctcp_segment_ptr->seqno))
      {
        ll_add_front(state->rx_state.segments_to_output, segment);
      }
      else
      {
        for (i = 0; i < (length-1); ++i) 
        {
          ll_node_t* curr_node_ptr;
          ll_node_t* next_node_ptr;

          ctcp_segment_t* curr_ctcp_segment_ptr;
          ctcp_segment_t* next_ctcp_segment_ptr;

          if (i == 0) {
            curr_node_ptr = ll_front(state->rx_state.segments_to_output);
          } else {
            curr_node_ptr = curr_node_ptr->next;
          }
          next_node_ptr = curr_node_ptr->next;

          curr_ctcp_segment_ptr = (ctcp_segment_t*) curr_node_ptr->object;
          next_ctcp_segment_ptr = (ctcp_segment_t*) next_node_ptr->object;

          if ((ntohl(segment->seqno) == ntohl(curr_ctcp_segment_ptr->seqno)) ||
              (ntohl(segment->seqno) == ntohl(next_ctcp_segment_ptr->seqno)))
          {
            free(segment);
            break;
          }
          else
          {
            if ((ntohl(segment->seqno) > ntohl(curr_ctcp_segment_ptr->seqno)) &&
                (ntohl(segment->seqno) < ntohl(next_ctcp_segment_ptr->seqno)))
            {
              ll_add_after(state->rx_state.segments_to_output, curr_node_ptr, segment);
              break;
            }
          }
        } 
      }
    }
  }
  else
  {
    free(segment);
  }
  ctcp_output(state);
  ctcp_clean_up_unacked_segment_list(state);
}

void ctcp_output(ctcp_state_t *state) {
  /* FIXME */
  ll_node_t* front_node_ptr;
  ctcp_segment_t* ctcp_segment_ptr;
  size_t bufspace;
  int num_data_bytes;
  int return_value;
  int num_segments_output = 0;

  if (state == NULL)
    return;

  while (ll_length(state->rx_state.segments_to_output) != 0) 
  {
    front_node_ptr = ll_front(state->rx_state.segments_to_output);
    ctcp_segment_ptr = (ctcp_segment_t*) front_node_ptr->object;

    num_data_bytes = ntohs(ctcp_segment_ptr->len) - sizeof(ctcp_segment_t);
    if (num_data_bytes) 
    {
      if ( ntohl(ctcp_segment_ptr->seqno) != state->rx_state.last_seqno_accepted + 1)
      {
        return;
      }
      bufspace = conn_bufspace(state->conn);
      if (bufspace < num_data_bytes)
      {
        return;
      }

      return_value = conn_output(state->conn, ctcp_segment_ptr->data, num_data_bytes);
      if (return_value == -1) 
      {
        ctcp_destroy(state);
        return;
      }
      assert(return_value == num_data_bytes);
      num_segments_output++;
    }

    if (num_data_bytes) 
    {
      state->rx_state.last_seqno_accepted += num_data_bytes;
    }

    if ((!state->rx_state.has_FIN_been_rxed) && (ctcp_segment_ptr->flags & TH_FIN))
    {
      state->rx_state.has_FIN_been_rxed = true;
      state->rx_state.last_seqno_accepted++;
      conn_output(state->conn, ctcp_segment_ptr->data, 0);
      num_segments_output++;
    }

    free(ctcp_segment_ptr);
    ll_remove(state->rx_state.segments_to_output, front_node_ptr);
  }

  if (num_segments_output) 
  {
    ctcp_send_control_segment(state);
  }
}

static void 
ctcp_clean_up_unacked_segment_list(ctcp_state_t *state)
{
  ll_node_t* front_node_ptr;
  wrapped_ctcp_segment_t* wrapped_ctcp_segment_ptr;
  uint32_t seqno_of_last_byte;
  uint16_t num_data_bytes;

  while (ll_length(state->tx_state.wrapped_unacked_segments) != 0) 
  {
    front_node_ptr = ll_front(state->tx_state.wrapped_unacked_segments);
    wrapped_ctcp_segment_ptr = (wrapped_ctcp_segment_t*) front_node_ptr->object;
    num_data_bytes = ntohs(wrapped_ctcp_segment_ptr->ctcp_segment.len) - sizeof(ctcp_segment_t);
    seqno_of_last_byte =   ntohl(wrapped_ctcp_segment_ptr->ctcp_segment.seqno)
                         + num_data_bytes - 1;

    if (seqno_of_last_byte < state->tx_state.last_ackno_rxed) 
    {
      free(wrapped_ctcp_segment_ptr);
      ll_remove(state->tx_state.wrapped_unacked_segments, front_node_ptr);
    } 
    else 
    {
      return;
    }
  }
}

static void 
ctcp_send_control_segment(ctcp_state_t *state)
{
  ctcp_segment_t ctcp_segment;

  ctcp_segment.seqno = htonl(0); 
  ctcp_segment.ackno = htonl(state->rx_state.last_seqno_accepted + 1);
  ctcp_segment.len   = sizeof(ctcp_segment_t);
  ctcp_segment.flags = TH_ACK;
  ctcp_segment.window = htons(state->ctcp_config.recv_window);
  ctcp_segment.cksum = 0;
  ctcp_segment.cksum = cksum(&ctcp_segment, sizeof(ctcp_segment_t));

  conn_send(state->conn, &ctcp_segment, sizeof(ctcp_segment_t));
}

static uint16_t 
ctcp_get_num_data_bytes(ctcp_segment_t* ctcp_segment_ptr)
{
  return ntohs(ctcp_segment_ptr->len) - sizeof(ctcp_segment_t);
}

void ctcp_timer() {
  /* FIXME */
  ctcp_state_t * curr_state;

  if (state_list == NULL) 
  {
    return;
  }

  for (curr_state = state_list; curr_state != NULL; curr_state = curr_state->next) 
  {
    ctcp_output(curr_state);
    ctcp_send_what_we_can(curr_state);

    if ((curr_state->rx_state.has_FIN_been_rxed)
      && (curr_state->tx_state.has_EOF_been_read)
      && (ll_length(curr_state->tx_state.wrapped_unacked_segments) == 0)
      && (ll_length(curr_state->rx_state.segments_to_output) == 0)) 
    {
      if (curr_state->FIN_WAIT_start_time == 0) 
      {
        curr_state->FIN_WAIT_start_time = current_time();
      } 
      else if ((current_time() - curr_state->FIN_WAIT_start_time) > (2*MAX_SEG_LIFETIME_MS)) 
      {
        ctcp_destroy(curr_state);
      }
    }
  }
}
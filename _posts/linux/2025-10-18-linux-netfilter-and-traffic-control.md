---
layout: post
title: "Linux Netfilter and Traffic Control"
date: 2025-10-18 10:00:00 +0700
categories: [Linux]
---

## Overview

<div style="text-align: justify; text-indent: 2em;">
Netfilter is a framework inside the Linux kernel which offers flexibility for various networking-related operations to be implemented in form of customized handlers. Netfilter offers various options for packet filtering, network address translation, and port translation.
Its components:
</div>

![H1](/assets/img/linux/Netfilter-components.svg)

<div style="text-align: justify; text-indent: 2em;">
And the flow of network packets through the Netfilter:
</div>

![H1](/assets/img/linux/netfilterdataflow.png)

## Netfilter Hooks in the Linux Kernel

### Netfilter places

<div style="text-align: justify; text-indent: 2em;">
As can be seen from the network packet sending and receiving flow diagram above, the hook function of Nefilter can be registered in many different places. It is defined as follows:
</div>

```c
enum nf_inet_hooks {
        NF_INET_PRE_ROUTING,
        NF_INET_LOCAL_IN,
        NF_INET_FORWARD,
        NF_INET_LOCAL_OUT,
        NF_INET_POST_ROUTING,
        NF_INET_NUMHOOKS
};
```
- NF_INET_PRE_ROUTING: incoming packets pass this hook in the ip_rcv() (linux/net/ipv4/ip_input.c) function before they are processed by the routing code.
- NF_INET_LOCAL_IN: all incoming packets addressed to the local computer pass this hook in the function ip_local_deliver().
- NF_INET_FORWARD: incoming packets are passed this hook in the function ip_forwared().
- NF_INET_LOCAL_OUT: all outgoing packets created in the local computer pass this hook in the function ip_build_and_send_pkt().
- NF_INET_POST_ROUTING: this hook in the ipfinishoutput() function before they leave the computer.

### Register the hooks

<div style="text-align: justify; text-indent: 2em;">
The kernel provides the following functions to register and unregister functions.
</div>

```c
int nf_register_hook(struct nf_hook_ops *reg);
void nf_unregister_hook(struct nf_hook_ops *reg);
int nf_register_hooks(struct nf_hook_ops *reg, unsigned int n);
void nf_unregister_hooks(struct nf_hook_ops *reg, unsigned int n);
```

<div style="text-align: justify; text-indent: 2em;">
Among them, nf_hook_ops is structured as follows:
</div>

```c
struct nf_hook_ops
{
        struct list_head list;

        /* User fills in from here down. */
        nf_hookfn *hook;
        struct module *owner;
        u_int8_t pf;
        unsigned int hooknum;
        /* Hooks are ordered in ascending priority. */
        int priority;
};
```
### hook functions

<div style="text-align: justify; text-indent: 2em;">
The hook function is specified by nf_hookfn *hook and its function declaration is as follows:
</div>

```c
typedef unsigned int nf_hookfn(unsigned int hooknum,
                               struct sk_buff *skb,
                               const struct net_device *in,
                               const struct net_device *out,
                               int (*okfn)(struct sk_buff *));
```

<div style="text-align: justify; text-indent: 2em;">
It returns one of the following results:
</div>

```c
// <linux/netfilter.h>
#define NF_DROP 0
#define NF_ACCEPT 1
#define NF_STOLEN 2
#define NF_QUEUE 3
#define NF_REPEAT 4
#define NF_STOP 5
#define NF_MAX_VERDICT NF_STOP
```
## pf

<div style="text-align: justify; text-indent: 2em;">
pf (protocol family) is the identifier of the protocol family.
</div>

```c
enum {
        NFPROTO_UNSPEC =  0,
        NFPROTO_IPV4   =  2,
        NFPROTO_ARP    =  3,
        NFPROTO_BRIDGE =  7,
        NFPROTO_IPV6   = 10,
        NFPROTO_DECNET = 12,
        NFPROTO_NUMPROTO,
};
```
## hooknum

<div style="text-align: justify; text-indent: 2em;">
This is the hook identifier. All valid identifiers for each protocol family are defined in a header file, for example <linux/netfilter_ipv4.h>:
</div>

```c
/* IP Hooks */
/* After promisc drops, checksum checks. */
#define NF_IP_PRE_ROUTING       0
/* If the packet is destined for this box. */
#define NF_IP_LOCAL_IN          1
/* If the packet is destined for another interface. */
#define NF_IP_FORWARD           2
/* Packets coming from a local process. */
#define NF_IP_LOCAL_OUT         3
/* Packets about to hit the wire. */
#define NF_IP_POST_ROUTING      4
#define NF_IP_NUMHOOKS          5
```

### priority

<div style="text-align: justify; text-indent: 2em;">
This is the priority of the hook. All valid identifiers for each protocol family are defined in a header file, for example <linux/netfilter_ipv4.h>
</div>

```c
enum nf_ip_hook_priorities {
        NF_IP_PRI_FIRST = INT_MIN,
        NF_IP_PRI_CONNTRACK_DEFRAG = -400,
        NF_IP_PRI_RAW = -300,
        NF_IP_PRI_SELINUX_FIRST = -225,
        NF_IP_PRI_CONNTRACK = -200,
        NF_IP_PRI_MANGLE = -150,
        NF_IP_PRI_NAT_DST = -100,
        NF_IP_PRI_FILTER = 0,
        NF_IP_PRI_SECURITY = 50,
        NF_IP_PRI_NAT_SRC = 100,
        NF_IP_PRI_SELINUX_LAST = 225,
        NF_IP_PRI_CONNTRACK_CONFIRM = INT_MAX,
        NF_IP_PRI_LAST = INT_MAX,
};

enum {
        NFPROTO_UNSPEC =  0,
        NFPROTO_IPV4   =  2,
        NFPROTO_ARP    =  3,
        NFPROTO_BRIDGE =  7,
        NFPROTO_IPV6   = 10,
        NFPROTO_DECNET = 12,
        NFPROTO_NUMPROTO,
};

```

## Netfilter hooks example

<div style="text-align: justify; text-indent: 2em;">
Register a hook function at NF_INET_LOCAL_IN to print the source MAC address, destination and IP address of the packet. Download the source packet.
</div>

```c
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/types.h>
#include <linux/skbuff.h>
#include <linux/ip.h>
#include <linux/udp.h>
#include <linux/tcp.h>
#include <linux/netfilter.h>
#include <linux/netfilter_ipv4.h>


MODULE_LICENSE("GPLv3");
MODULE_AUTHOR("You");
MODULE_DESCRIPTION("Netfliter test");

static unsigned int
nf_test_in_hook(unsigned int hook, struct sk_buff *skb, const struct net_device *in,
                const struct net_device *out, int (*okfn)(struct sk_buff*));

static struct nf_hook_ops nf_test_ops[] __read_mostly = {
  {
    .hook = nf_test_in_hook,
    .owner = THIS_MODULE,
    .pf = NFPROTO_IPV4,
    .hooknum = NF_INET_LOCAL_IN,
    .priority = NF_IP_PRI_FIRST,
  },
};

void hdr_dump(struct ethhdr *ehdr) {
    printk("[MAC_DES:%x,%x,%x,%x,%x,%x" 
           "MAC_SRC: %x,%x,%x,%x,%x,%x Prot:%x]\n",
           ehdr->h_dest[0],ehdr->h_dest[1],ehdr->h_dest[2],ehdr->h_dest[3],
           ehdr->h_dest[4],ehdr->h_dest[5],ehdr->h_source[0],ehdr->h_source[1],
           ehdr->h_source[2],ehdr->h_source[3],ehdr->h_source[4],
           ehdr->h_source[5],ehdr->h_proto);
}

#define NIPQUAD(addr) \
        ((unsigned char *)&addr)[0], \
        ((unsigned char *)&addr)[1], \
        ((unsigned char *)&addr)[2], \
        ((unsigned char *)&addr)[3]
#define NIPQUAD_FMT "%u.%u.%u.%u"

static unsigned int
nf_test_in_hook(unsigned int hook, struct sk_buff *skb, const struct net_device *in,
                const struct net_device *out, int (*okfn)(struct sk_buff*)) {
  struct ethhdr *eth_header;
  struct iphdr *ip_header;
  eth_header = (struct ethhdr *)(skb_mac_header(skb));
  ip_header = (struct iphdr *)(skb_network_header(skb));
  hdr_dump(eth_header);
  printk("src IP:'"NIPQUAD_FMT"', dst IP:'"NIPQUAD_FMT"' \n",
         NIPQUAD(ip_header->saddr), NIPQUAD(ip_header->daddr));
  return NF_ACCEPT;
}

static int __init init_nf_test(void) {
  int ret;
  ret = nf_register_hooks(nf_test_ops, ARRAY_SIZE(nf_test_ops));
  if (ret < 0) {
    printk("register nf hook fail\n");
    return ret;
  }
  printk(KERN_NOTICE "register nf test hook\n");
  return 0;
}

static void __exit exit_nf_test(void) {
  nf_unregister_hooks(nf_test_ops, ARRAY_SIZE(nf_test_ops));
}

module_init(init_nf_test);
module_exit(exit_nf_test);
```

## References

1. https://wiki.dreamrunner.org/public_html/Linux/Networks/netfilter.html
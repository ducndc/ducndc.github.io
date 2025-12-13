---
layout: post
title: "Denial of Service"
date: 2025-12-12 10:00:00 +0700
categories: [Hacking]
---

## What is a DoS Attack?

Denial of Service (DoS) is an attack on a computer or network that reduces, restricts, or prevents accessibility of system resources to its legitimate users

In a DoS attack, attackers flood the victim system with non-legitimate service requests or traffic to overload its resources

The impact of DoS attacks includes loss of goodwill, network outages, financial losses, and operational disruptions

## LAB

# Synflood with metasploit

Implement following the Lab guide

The procedure includes the following steps:

- Scan for open ports using Nmap

- Then use the module **auxiliary/dos/tcp/synflood**

- The device can spoofed source ip (random source IP)

- Before attacking, start wireshark/tcpdump to see the packet

# Synflood with hping3

Follow the instructions in the lab guide

hping3 command:

hping3 -S -p 3389 --rand-source --flood 192.168.111.112

Explanation of some HPing3 options:

-S: sync scan

-a: spoof with a fixed source address

--rand-source: spoof with multiple random IP addresses

-p 22: port 22

--flood

Example output:

Syncflood to port 80 of a 32-bit Windows 7 machine:

Syncflood to port 3389 of a 32-bit Windows 7 machine

Syncflood to port 3389 of a 64-bit Windows 7 machine (SP1)

Compare Windows versions:

Windows 32-bit: (lower version)

Windows 64-bit: => SP1

- You can open other terminals to continue using this DoS technique

to attack the victim or use other machines To attack the Victim

# SMB Service DOS Attack - Memory DoS (metasploit)

In Kali, open Terminal, type the following command to increase the number of concurrent opened files in the open terminal:

root@kali:~# **ulimit -n 65535**

or

**ulimit -n unlimited**

Then open msfconsole, use the module auxiliary/dos/smb/smb_loris:

root@kali:~# **msfconsole -q**

msf \> **use auxiliary/dos/smb/smb_loris**

msf auxiliary(smb_loris) \> **set RHOST 192.168.111.112**

RHOST => **192.168.111.112**

msf auxiliary(smb_loris) \> **run**

- In Windows 7, open Task Manager, switch to the tab Performance:

- Disabling the attack:

- You can open other terminals to continue using this DoS technique

to attack the victim or use other machines to attack the victim.

# DoS attack on Windows 7 RDP service

In Kali, enable msfconsole

Use the following module in metasploit:

**auxiliary/dos/windows/rdp/ms12_020_maxchannelids**

Set the RHOST parameter, then run the Windows machine if this vulnerability is present and RDP is enabled

it will crash (BSOD)

# Metasploit HTTP Slowloris module

Use the Msfconsole module auxiliary/dos/http/slowloris:

**use auxiliary/dos/http/slowloris**

**show info**

Operation: monopolizes all server connections, exhausts the concurrent connection pool => Webserver will deny new connections

Comparison:

1. Set rhost to Win7 32-bit (install IIS) and run the module, check after

about 15-30 seconds, open your browser and check if the Webserver is still accessible


2. Similarly: set rhost to Metasploitable2 (install Apache) and run the module,

check after about 15-30 seconds, open your browser and check if the Webserver is still accessible



# DOS Attack L7 - Slowloris with OWASP DOS Tool and metasploit

## Objective: {#objective}

- Launch a DOS attack on the HTTP service (Application-based DOS attack) by

exploiting the Slowloris vulnerability.

- Hackers exploit the Slowloris vulnerability by sending incomplete requests to the web server.
=> The web server has to reserve many slots in its connection pool to wait.
=> The web server's connection pool will be completely occupied by the hacker.
=> Other users cannot access the service even if the server's CPU and bandwidth are normal.

- Download link for HTTP Dos Tool for Windows:

<https://samsclass.info/123/proj14/HttpDosTool4.0.zip>

- In Kali, use the auxiliary/dos/http/slowloris module.

## Requirements:

2 Virtual Machines:

- Kali: Use the auxiliary/dos/http/slowloris module to perform a DOS attack.

- Win7: To run the Owasp HTTP Dos Tool 4.0 to perform a DOS attack.

- Metasploitable2: Web server

## Procedure:

1. Open Firefox and go to the following link to monitor the status of the Apache service on the Metasploitable2 machine (M2):

http://10.1.1.49/server-status

Note that the ...... represents the remaining free pools in the Apache connection pool.

2. SSH into the M2 machine (or access the console) and type the command "**top**" to monitor CPU and Memory performance. of machine M2 (note the CPU idle parameter, e.g.,

98.4 id ~ CPU free 98.4%):

3. In Win7 or the physical machine, open a browser, access the status page on
machine M2 to see the status of Apache2. Go to other M2 pages to
test the connection.

4. In the Win7 VM, install the Owasp HTTP Dos Tool 4.0 (in the

additional tools folder).

Or go to msfconsole in Kali and use the module
auxiliary/dos/http/slowloris to launch a DoS attack.

5. Perform the attack:

a. In the Win7 machine:

> Run HTTP Dos Tool 4.0. Configure the Connection and Connection parameters.

> Rate (can be customized to find the maximum connection pool of the web server) -

> Then click Attack to launch the attack, wait about 30 seconds => next, on other machines, check if the connection is

When accessing the M2 website, you will find it inaccessible:
> because the Apache connection pool is full.

b. In Kali:

> Go to msfconsole in Kali and use the module

> auxiliary/dos/http/slowloris, configure it as follows, then type the command run -j -z

> to perform a DoS attack:

6. Monitor the status page (refresh the status page), note that the ..... part will be

replaced with RRRRRR because the connection pool is full:

# Some other DOS tools:

## Impulse:

A tool that combines several DOS attack techniques:

<https://github.com/LimerBoy/Impulse/blob/master/README.md>

## Xerxes

<https://github.com/zanyarjamal/xerxes>

## hulk

Download from this page:

<https://packetstormsecurity.com/files/112856/HULK-Http-Unbearable-Load-King.html>

How to use: python3 hulk.py http://urlsample.com
---
title: 'The Engineering Bookshelf'
description: 'A curated reading list for engineers: software design, algorithms, Linux and operating systems, programming, networking and RF, electronics, and a few classics on strategy, with a suggested reading path.'
pubDate: 'Mar 28 2026'
updatedDate: 'Nov 21 2026'
heroImage: '../../assets/hero/bookshelf.jpg'
category: 'Personal'
---

These are the books that shaped how I think about systems: from discrete math and algorithms, through the Linux kernel and network stacks, down to transistors and antennas. Each entry has a short note on why it is worth your time and a link to find it. Most of them are textbooks you will come back to for years, not books you read once.

<div class="shelf-legend">
	<span class="lvl lvl-1">Foundation</span> start here
	<span class="lvl lvl-2">Intermediate</span> once the basics are solid
	<span class="lvl lvl-3">Advanced</span> deep references
</div>

---

### Software Design

---

<div class="books">
	<a class="book" href="https://openlibrary.org/search?q=Systems+Analysis+and+Design+with+UML+Dennis" target="_blank" rel="noopener">
		<span class="lvl lvl-1">Foundation</span>
		<strong>Systems Analysis and Design with UML</strong>
		<em>Alan Dennis, Barbara Haley Wixom, David Tegarden</em>
		<p>Requirements, use cases and UML models, taken all the way from an idea to a design you can build.</p>
	</a>
</div>

---

### Data Structures and Algorithms

---

<div class="books">
	<a class="book" href="https://openlibrary.org/search?q=Introduction+to+Algorithms+Cormen" target="_blank" rel="noopener">
		<span class="lvl lvl-3">Advanced</span>
		<strong>Introduction to Algorithms</strong>
		<em>Cormen, Leiserson, Rivest, Stein · 3rd ed. (a 4th edition appeared in 2022)</em>
		<p>"CLRS": the reference for algorithm design and analysis, with proofs for everything.</p>
	</a>
	<a class="book" href="https://openlibrary.org/search?q=Data+Structures+and+Algorithms+Made+Easy+Karumanchi" target="_blank" rel="noopener">
		<span class="lvl lvl-1">Foundation</span>
		<strong>Data Structures and Algorithms Made Easy</strong>
		<em>Narasimha Karumanchi</em>
		<p>Problem-driven and practical: hundreds of worked exercises, good for interview preparation.</p>
	</a>
	<a class="book" href="https://openlibrary.org/search?q=Discrete+Mathematics+and+Its+Applications+Rosen" target="_blank" rel="noopener">
		<span class="lvl lvl-1">Foundation</span>
		<strong>Discrete Mathematics and Its Applications</strong>
		<em>Kenneth H. Rosen · 7th ed.</em>
		<p>Logic, sets, combinatorics, graphs and proofs: the math underneath every algorithm.</p>
	</a>
</div>

---

### Linux & Operating Systems

---

<div class="books">
	<a class="book" href="https://openlibrary.org/search?q=Operating+System+Concepts+Silberschatz" target="_blank" rel="noopener">
		<span class="lvl lvl-1">Foundation</span>
		<strong>Operating System Concepts</strong>
		<em>Abraham Silberschatz, Peter B. Galvin, Greg Gagne</em>
		<p>"The dinosaur book": processes, threads, memory, scheduling and storage, independent of any one OS.</p>
	</a>
	<a class="book" href="https://openlibrary.org/search?q=Linux+Kernel+Development+Robert+Love" target="_blank" rel="noopener">
		<span class="lvl lvl-2">Intermediate</span>
		<strong>Linux Kernel Development</strong>
		<em>Robert Love · 3rd ed.</em>
		<p>The friendliest tour of the kernel: scheduler, system calls, interrupts, synchronization and memory.</p>
	</a>
	<a class="book" href="https://openlibrary.org/search?q=Understanding+the+Linux+Kernel+Bovet" target="_blank" rel="noopener">
		<span class="lvl lvl-3">Advanced</span>
		<strong>Understanding the Linux Kernel</strong>
		<em>Daniel P. Bovet, Marco Cesati · 3rd ed.</em>
		<p>A line-by-line look at how the core subsystems really work. Older kernel, but the ideas still hold.</p>
	</a>
	<a class="book" href="https://openlibrary.org/search?q=Professional+Linux+Kernel+Architecture+Mauerer" target="_blank" rel="noopener">
		<span class="lvl lvl-3">Advanced</span>
		<strong>Professional Linux Kernel Architecture</strong>
		<em>Wolfgang Mauerer</em>
		<p>A thick, detailed reference across memory management, file systems, networking and modules.</p>
	</a>
	<a class="book" href="https://lwn.net/Kernel/LDD3/" target="_blank" rel="noopener">
		<span class="lvl lvl-2">Intermediate</span>
		<strong>Linux Device Drivers</strong>
		<em>Jonathan Corbet, Alessandro Rubini, Greg Kroah-Hartman · 3rd ed.</em>
		<p>"LDD3": character devices, concurrency, interrupts and DMA. Free to read online from LWN.</p>
		<span class="free">Free online</span>
	</a>
	<a class="book" href="https://openlibrary.org/search?q=Building+Embedded+Linux+Systems+Yaghmour" target="_blank" rel="noopener">
		<span class="lvl lvl-2">Intermediate</span>
		<strong>Building Embedded Linux Systems</strong>
		<em>Karim Yaghmour et al.</em>
		<p>Toolchains, bootloaders, root file systems and storage: how an embedded Linux product is put together.</p>
	</a>
	<a class="book" href="https://openlibrary.org/search?q=Understanding+Linux+Network+Internals+Benvenuti" target="_blank" rel="noopener">
		<span class="lvl lvl-3">Advanced</span>
		<strong>Understanding Linux Network Internals</strong>
		<em>Christian Benvenuti</em>
		<p>The kernel networking stack from the device driver up: sk_buffs, NAPI, bridging, routing and neighbors.</p>
	</a>
</div>

---

### Programming & Firmware

---

<div class="books">
	<a class="book" href="https://openlibrary.org/search?q=The+C+Programming+Language+Kernighan+Ritchie" target="_blank" rel="noopener">
		<span class="lvl lvl-1">Foundation</span>
		<strong>The C Programming Language</strong>
		<em>Brian W. Kernighan, Dennis M. Ritchie · 2nd ed.</em>
		<p>"K&amp;R": short, precise and still the best introduction to C.</p>
	</a>
	<a class="book" href="https://man7.org/tlpi/" target="_blank" rel="noopener">
		<span class="lvl lvl-2">Intermediate</span>
		<strong>The Linux Programming Interface</strong>
		<em>Michael Kerrisk</em>
		<p>The definitive guide to Linux system programming: files, processes, signals, threads, IPC and sockets.</p>
	</a>
	<a class="book" href="https://openlibrary.org/search?q=Effective+Modern+C%2B%2B+Meyers" target="_blank" rel="noopener">
		<span class="lvl lvl-2">Intermediate</span>
		<strong>Effective Modern C++</strong>
		<em>Scott Meyers</em>
		<p>42 specific ways to use C++11 and C++14 well: move semantics, smart pointers, lambdas and more.</p>
	</a>
	<a class="book" href="https://openlibrary.org/search?q=The+C%2B%2B+Programming+Language+Stroustrup" target="_blank" rel="noopener">
		<span class="lvl lvl-3">Advanced</span>
		<strong>The C++ Programming Language</strong>
		<em>Bjarne Stroustrup</em>
		<p>The complete language reference, from its creator.</p>
	</a>
	<a class="book" href="https://openlibrary.org/search?q=Reusable+Firmware+Development+Beningo" target="_blank" rel="noopener">
		<span class="lvl lvl-2">Intermediate</span>
		<strong>Reusable Firmware Development</strong>
		<em>Jacob Beningo</em>
		<p>Hardware abstraction layers and APIs that let firmware outlive the microcontroller it was written for.</p>
	</a>
	<a class="book" href="https://openlibrary.org/search?q=The+Art+of+Software+Testing+Myers" target="_blank" rel="noopener">
		<span class="lvl lvl-1">Foundation</span>
		<strong>The Art of Software Testing</strong>
		<em>Glenford J. Myers et al.</em>
		<p>A short classic on the testing mindset: test-case design, inspections and debugging.</p>
	</a>
</div>

---

### Telecommunications & Networking

---

<div class="books">
	<a class="book" href="https://openlibrary.org/search?q=Computer+Networking+A+Top-Down+Approach+Kurose" target="_blank" rel="noopener">
		<span class="lvl lvl-1">Foundation</span>
		<strong>Computer Networking: A Top-Down Approach</strong>
		<em>James F. Kurose, Keith W. Ross</em>
		<p>Starts from applications and works down to the link layer. The clearest first networking book.</p>
	</a>
	<a class="book" href="https://openlibrary.org/search?q=UNIX+Network+Programming+Stevens" target="_blank" rel="noopener">
		<span class="lvl lvl-2">Intermediate</span>
		<strong>UNIX Network Programming, Vol. 1</strong>
		<em>W. Richard Stevens et al.</em>
		<p>Sockets in depth: TCP, UDP, I/O models and the details that make network code robust.</p>
	</a>
	<a class="book" href="https://openlibrary.org/search?q=RF+Microelectronics+Razavi" target="_blank" rel="noopener">
		<span class="lvl lvl-3">Advanced</span>
		<strong>RF Microelectronics</strong>
		<em>Behzad Razavi</em>
		<p>Transceiver architectures, LNAs, mixers, oscillators and PLLs: what happens inside the radio chip.</p>
	</a>
	<a class="book" href="https://openlibrary.org/search?q=Antenna+Theory+Analysis+and+Design+Balanis" target="_blank" rel="noopener">
		<span class="lvl lvl-3">Advanced</span>
		<strong>Antenna Theory: Analysis and Design</strong>
		<em>Constantine A. Balanis</em>
		<p>The standard antenna textbook: radiation patterns, gain, arrays and practical antenna types.</p>
	</a>
	<a class="book" href="https://openlibrary.org/search?q=Mobile+Radio+Channels+Patzold" target="_blank" rel="noopener">
		<span class="lvl lvl-3">Advanced</span>
		<strong>Mobile Radio Channels</strong>
		<em>Matthias Pätzold</em>
		<p>Fading, multipath and channel models, the propagation theory behind every wireless standard.</p>
	</a>
</div>

---

### Electronic Theory & Hardware

---

<div class="books">
	<a class="book" href="https://openlibrary.org/search?q=Computer+Organization+and+Design+Patterson+Hennessy" target="_blank" rel="noopener">
		<span class="lvl lvl-1">Foundation</span>
		<strong>Computer Organization and Design</strong>
		<em>David A. Patterson, John L. Hennessy</em>
		<p>Instruction sets, pipelines, caches and memory: the hardware/software interface explained.</p>
	</a>
	<a class="book" href="https://openlibrary.org/search?q=Digital+Logic+Circuit+Analysis+and+Design+Nelson" target="_blank" rel="noopener">
		<span class="lvl lvl-1">Foundation</span>
		<strong>Digital Logic Circuit Analysis and Design</strong>
		<em>Victor P. Nelson, H. Troy Nagle, Bill D. Carroll, J. David Irwin</em>
		<p>Boolean algebra, combinational and sequential logic, and state machines.</p>
	</a>
	<a class="book" href="https://openlibrary.org/search?q=Electronic+Devices+and+Circuit+Theory+Boylestad" target="_blank" rel="noopener">
		<span class="lvl lvl-1">Foundation</span>
		<strong>Electronic Devices and Circuit Theory</strong>
		<em>Robert L. Boylestad, Louis Nashelsky</em>
		<p>Diodes, transistors, amplifiers and op-amps, with plenty of worked examples.</p>
	</a>
	<a class="book" href="https://openlibrary.org/search?q=The+Intel+Microprocessors+Brey" target="_blank" rel="noopener">
		<span class="lvl lvl-2">Intermediate</span>
		<strong>The Intel Microprocessors</strong>
		<em>Barry B. Brey</em>
		<p>x86 architecture, assembly programming and interfacing, from the 8086 to modern cores.</p>
	</a>
</div>

---

### Machine Learning

---

<div class="books">
	<a class="book" href="https://openlibrary.org/search?q=Basics+of+Machine+Learning" target="_blank" rel="noopener">
		<span class="lvl lvl-1">Foundation</span>
		<strong>Basics of Machine Learning</strong>
		<em>Introductory text</em>
		<p>A gentle start on supervised and unsupervised learning before moving to the heavier references.</p>
	</a>
</div>

---

### Strategy & Defence Technology

---

<div class="books">
	<a class="book" href="https://www.gutenberg.org/ebooks/132" target="_blank" rel="noopener">
		<span class="lvl lvl-1">Foundation</span>
		<strong>The Art of War (Binh pháp Tôn Tử)</strong>
		<em>Sun Tzu</em>
		<p>Thirteen short chapters on strategy, preparation and knowing yourself and your opponent.</p>
		<span class="free">Free · Project Gutenberg</span>
	</a>
	<a class="book" href="https://www.gutenberg.org/ebooks/1946" target="_blank" rel="noopener">
		<span class="lvl lvl-3">Advanced</span>
		<strong>On War (Vom Kriege)</strong>
		<em>Carl von Clausewitz</em>
		<p>The classic Western treatise on war as the continuation of policy, friction and the fog of uncertainty.</p>
		<span class="free">Free · Project Gutenberg</span>
	</a>
	<a class="book" href="https://openlibrary.org/search?q=General+Design+Principle+of+Artillery" target="_blank" rel="noopener">
		<span class="lvl lvl-3">Advanced</span>
		<strong>General Design Principles of Artillery</strong>
		<em>Engineering text</em>
		<p>Interior ballistics, mechanisms and structural design: mechanical engineering at its most demanding.</p>
	</a>
</div>

---

> Please buy or borrow these books from publishers, bookstores or your library, and support the authors who wrote them. Several are free legally: *Linux Device Drivers* on LWN, and the classics on Project Gutenberg.

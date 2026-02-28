/**
 * Enhanced User Experience Features
 * Scroll-to-top, animations, and interactive improvements
 */

document.addEventListener('DOMContentLoaded', function() {
  
  // ===== Back to Top Button =====
  const backToTopBtn = createBackToTopButton();
  
  window.addEventListener('scroll', function() {
    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  });
  
  backToTopBtn.addEventListener('click', function(e) {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  // ===== Smooth Link Scrolling =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
  
  // ===== Intersection Observer for Animations =====
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Apply observer to content sections
  document.querySelectorAll('.post-preview, .card, article').forEach(el => {
    observer.observe(el);
  });
  
  // ===== Image Lazy Loading Enhancement =====
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.style.opacity = '0';
          img.onload = () => {
            img.style.transition = 'opacity 0.3s ease';
            img.style.opacity = '1';
          };
          imageObserver.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll('img').forEach(img => {
      imageObserver.observe(img);
    });
  }
  
  // ===== Active Navigation Link Highlighting =====
  highlightActiveNavLink();
  window.addEventListener('scroll', highlightActiveNavLink);
  
  // ===== Table of Contents Enhancement =====
  enhanceTOC();
  
  // ===== Code Block Enhancement =====
  enhanceCodeBlocks();
  
  // ===== Performance Metrics =====
  logPerformanceMetrics();
  
});

/**
 * Create and append back-to-top button
 */
function createBackToTopButton() {
  const btn = document.createElement('div');
  btn.className = 'back-to-top';
  btn.innerHTML = '↑';
  btn.setAttribute('title', 'Back to top');
  document.body.appendChild(btn);
  return btn;
}

/**
 * Highlight active navigation link
 */
function highlightActiveNavLink() {
  const sections = document.querySelectorAll('h2[id]');
  const navLinks = document.querySelectorAll('nav a');
  
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    if (pageYOffset >= sectionTop - 200) {
      current = section.getAttribute('id');
    }
  });
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}

/**
 * Enhance table of contents
 */
function enhanceTOC() {
  const toc = document.querySelector('.toc');
  if (!toc) return;
  
  const links = toc.querySelectorAll('a');
  links.forEach(link => {
    link.style.transition = 'all 0.3s ease';
    link.addEventListener('mouseenter', function() {
      this.style.paddingLeft = '8px';
    });
    link.addEventListener('mouseleave', function() {
      this.style.paddingLeft = '0';
    });
  });
}

/**
 * Enhance code blocks with copy button
 */
function enhanceCodeBlocks() {
  const codeBlocks = document.querySelectorAll('pre');
  
  codeBlocks.forEach(block => {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = 'Copy';
    copyBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 6px 12px;
      background-color: rgba(102, 126, 234, 0.8);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85em;
      transition: all 0.3s ease;
      opacity: 0;
    `;
    
    block.style.position = 'relative';
    block.appendChild(copyBtn);
    
    block.addEventListener('mouseenter', () => {
      copyBtn.style.opacity = '1';
    });
    
    block.addEventListener('mouseleave', () => {
      copyBtn.style.opacity = '0';
    });
    
    copyBtn.addEventListener('click', () => {
      const code = block.innerText;
      navigator.clipboard.writeText(code).then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = 'Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
        }, 2000);
      });
    });
  });
}

/**
 * Log performance metrics
 */
function logPerformanceMetrics() {
  if (window.performance && window.performance.timing) {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    console.log('Page Load Time: ' + pageLoadTime + 'ms');
  }
}

/**
 * Throttle function for performance
 */
function throttle(func, wait) {
  let timeout = null;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Add smooth fade-in animation to elements on page load
 */
window.addEventListener('load', function() {
  document.querySelectorAll('[data-animate]').forEach((el, index) => {
    setTimeout(() => {
      el.style.animation = 'fadeInUp 0.6s ease forwards';
    }, index * 50);
  });
});

/**
 * Accessibility: Announce when content is loaded
 */
function announceContentLoaded() {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.style.display = 'none';
  announcement.textContent = 'Content loaded successfully';
  document.body.appendChild(announcement);
}

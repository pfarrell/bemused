// navigation.js
document.addEventListener('DOMContentLoaded', () => {
  loadPageScripts();
  // Store player state in localStorage when it changes
  const player = document.querySelector('audio');
  if (player) {
    player.addEventListener('timeupdate', () => {
      localStorage.setItem('playerTime', player.currentTime);
      localStorage.setItem('playerSrc', player.src);
    });
  }

  // Handle internal navigation
  document.addEventListener('click', async (e) => {
    // Find closest anchor tag with data-internal (handles nested elements in links)
    const link = e.target.closest('a[data-internal]');
    if (!link) return;
    
    e.preventDefault();
    const url = link.href;
    
    try {
      // Show loading state if needed
      document.querySelector('.main-content').classList.add('loading');
      
      // Fetch new content
      const response = await fetch(url, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const html = await response.text();
      
      // Update the URL
      history.pushState({}, '', url);
      await handlePageTransition(html);  // updated content and load javascripts if necessary
      
      // Update page title if provided
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      if (titleMatch) {
        document.title = titleMatch[1];
      }
    } catch (error) {
      console.error('Navigation failed:', error);
      // Fallback to regular navigation on error
      window.location = url;
    } finally {
      document.querySelector('.main-content').classList.remove('loading');
    }
  });

  // Add form handler
  const searchForms = document.querySelectorAll('form[data-internal]');

  if (searchForms.length > 0) {
    searchForms.forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;

        try {
          let url = form.action;
          let req = {
            method: form.method,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
          };

          if (form.method.toUpperCase() === 'POST') {
            req['body'] = new FormData(form);
          } else if (form.method.toUpperCase() === 'GET') {
            // Create URLSearchParams from form data
            const formData = new FormData(form);
            const searchParams = new URLSearchParams();

            // Add each form field to the search params
            for (const [key, value] of formData) {
              searchParams.append(key, value);
            }

            // Append search params to URL
            const queryString = searchParams.toString();
            if (queryString) {
              // Check if URL already has parameters
              url += (url.includes('?') ? '&' : '?') + queryString;
            }
          }

          try {
            document.querySelector('.main-content').classList.add('loading');
            const response = await fetch(url, req);
            const html = await response.text();
            await handlePageTransition(html);
          }finally {
            document.querySelector('.main-content').classList.remove('loading');
          }
          // Update browser history with the complete URL including query params
          history.pushState({}, '', url);
        } catch (error) {
          console.error('Form submission failed:', error);
          form.submit();
        }
      });
    });
  }


  // Handle browser back/forward buttons
  window.addEventListener('popstate', async () => {
    try {
      const response = await fetch(window.location.href, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      const html = await response.text();
      await handlePageTransition(html); // update content and load javascripts if necessary

    } catch (error) {
      console.error('Navigation failed:', error);
      window.location.reload();
    }
  });

  // Restore player state on page load
  function restorePlayerState() {
    const player = document.querySelector('audio');
    if (player) {
      const savedSrc = localStorage.getItem('playerSrc');
      const savedTime = localStorage.getItem('playerTime');
      
      if (savedSrc) {
        player.src = savedSrc;
        if (savedTime) {
          player.currentTime = parseFloat(savedTime);
        }
      }
    }
  }

  async function handlePageTransition(html) {
    const container = document.querySelector('.content-container');
    const scrollContainer = document.querySelector('.main-content');
    container.innerHTML = html;
    scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    await loadPageScripts();
    setTimeout(() => {
      window.scrollTo(0, 0);
      if (scrollContainer.scrollHeight > scrollContainer.clientHeight) {
        scrollContainer.scrollTo(0, 0);
      }
    }, .5);
  }

  async function loadPageScripts() {
    const pageScripts = document.querySelectorAll('meta[name="page-script"]');
    for (const script of pageScripts) {
      const modulePath = script.getAttribute('content');
      try {
        const module = await import(modulePath);
        if (typeof module.init === 'function') {
          module.init();
        }
        Object.assign(window, module);
      } catch (error) {
        console.error(`Failed to load module ${modulePath}:`, error);
      }
  }

  const dropBtn = document.querySelector('.dropdown');
  const dropContent = document.querySelector('.dropdown-content');

  if (dropBtn && dropContent) {
      dropBtn.addEventListener('click', (e) => {
          //e.stopPropagation();
          dropContent.classList.toggle('show');
      });

      document.addEventListener('click', (e) => {
          if (!dropBtn.contains(e.target)) {
              dropContent.classList.remove('show');
          }
      });
  }
}

  // Call on initial load
  restorePlayerState();
});

// Optional: Add loading indicator styles
const style = document.createElement('style');
style.textContent = `
  .main-content.loading {
    opacity: 0.6;
    transition: opacity 0.2s;
  }
`;
document.head.appendChild(style);

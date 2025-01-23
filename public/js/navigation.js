// navigation.js
document.addEventListener('DOMContentLoaded', () => {
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
      
      // Update main content
      document.querySelector('.content-container').innerHTML = html;
      
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
  const searchForm = document.querySelector('form[data-internal]');
  if (searchForm) {
    searchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      
      try {
        const response = await fetch(form.action, {
          method: form.method,
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: new FormData(form)
        });
        
        const html = await response.text();
        document.querySelector('.content-container').innerHTML = html;
        
        const url = `${form.action}?${new URLSearchParams(new FormData(form))}`;
        history.pushState({}, '', url);
      } catch (error) {
        console.error('Search failed:', error);
        form.submit();
      }
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
      document.querySelector('.content-container').innerHTML = html;
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

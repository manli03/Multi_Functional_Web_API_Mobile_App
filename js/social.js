document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');
  const searchButton = document.getElementById('search-button');
  const searchInput = document.getElementById('search-input');
  const paginationTop = document.getElementById('pagination-top');
  const paginationBottom = document.getElementById('pagination-bottom');
  const backToMenuButton = document.querySelector('.btn-secondary');
  const pageSize = 20;
  let currentPage = 1;
  let postsData = [];

  function logInteraction(type, action, error = null) {
    const interactions = JSON.parse(localStorage.getItem('interactions')) || [];
    const index = interactions.length;
    const interaction = {
      index: index,
      action: error ? `[${type}] ${action}: ${error}` : `[${type}] ${action}`,
      timestamp: new Date().toISOString()
    };
    interactions.push(interaction);
    localStorage.setItem('interactions', JSON.stringify(interactions));
  }

  logInteraction('SOCIAL', 'Page loaded');

  function fetchPosts(query = '') {
    loading.style.display = 'block';
    content.style.display = 'none';
    paginationTop.style.display = 'none';
    paginationBottom.style.display = 'none';

    let url = `https://www.reddit.com/r/malaysia/top/.json?limit=100`;
    if (query) {
      url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=100`;
    }

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        postsData = data.data.children;
        if (postsData.length === 0) {
          throw new Error('No data available for the selected search criteria.');
        }
        displayPage(currentPage);
        loading.style.display = 'none';
        content.style.display = 'flex';
        paginationTop.style.display = 'block';
        paginationBottom.style.display = 'block';
      })
      .catch(error => {
        logInteraction('SOCIAL', 'Error fetching posts data from API', error.message);
        loading.style.display = 'none';
        content.style.display = 'flex';
        content.innerHTML = `<p class="text-danger">${error.message}</p>`;
      });
  }

  function handleSearch(buttonType) {
    const query = searchInput.value;
    currentPage = 1;
    logInteraction('USER', `Performed search with ${buttonType}, Query: "${query}"`);
    fetchPosts(query);
  }

  searchButton.addEventListener('click', () => handleSearch('Search button'));

  searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      handleSearch('Enter key');
    }
  });

  function sanitizeHTML(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  }

  function displayPage(page) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pagePosts = postsData.slice(start, end);

    let postsHTML = '';
    for (const post of pagePosts) {
      const createdAt = moment.unix(post.data.created_utc).format('MMMM Do YYYY, h:mm:ss a');
      const imageUrl = post.data.thumbnail && post.data.thumbnail.startsWith('http') ? post.data.thumbnail : null;
      const url = post.data.url;

      const imageHTML = imageUrl ? `<img src="${imageUrl}" class="card-img-top" alt="Post Image" onerror="this.style.display='none';">` : '';

      postsHTML += `
        <div class="col-md-6">
          <div class="card">
            ${imageHTML}
            <div class="card-body">
              <h5 class="card-title">${post.data.title}</h5>
              <p class="card-text">${post.data.selftext_html ? sanitizeHTML(post.data.selftext_html) : ''}</p>
              <a href="${url}" target="_blank" class="btn btn-primary read-more-btn">Read more</a>
              <p class="card-text"><small class="text-muted">Posted at: ${createdAt} | Upvotes: ${post.data.ups}</small></p>
            </div>
          </div>
        </div>
      `;
    }

    content.innerHTML = postsHTML;
    updatePaginationControls();

    document.querySelectorAll('.read-more-btn').forEach(button => {
      button.addEventListener('click', (event) => {
        const cardBody = event.target.parentElement;
        const title = cardBody.querySelector('.card-title').textContent;
        const url = event.target.href;
        logInteraction('USER', `Clicked "Read more" for post: "${title}", URL: "${url}"`);
      });
    });
  }

  function updatePaginationControls() {
    const totalPages = Math.ceil(postsData.length / pageSize);
    let paginationHTML = '';

    for (let i = 1; i <= totalPages; i++) {
      paginationHTML += `<button class="btn btn-link${i === currentPage ? ' font-weight-bold' : ''}" onclick="changePage(${i})">${i}</button>`;
    }

    paginationTop.innerHTML = paginationHTML;
    paginationBottom.innerHTML = paginationHTML;

    document.querySelectorAll('#pagination-top .btn-link, #pagination-bottom .btn-link').forEach(button => {
      button.addEventListener('click', (event) => {
        logInteraction('USER', `Clicked pagination button: Page ${event.target.textContent}`);
        changePage(parseInt(event.target.textContent));
      });
    });
  }

  window.changePage = (page) => {
    currentPage = page;
    displayPage(currentPage);
  };

  backToMenuButton.addEventListener('click', () => {
    logInteraction('USER', 'Clicked Back to Main Menu button');
  });

  fetchPosts();
});

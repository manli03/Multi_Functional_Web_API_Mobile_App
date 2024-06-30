const pageSize = 20;
let currentPage = 1;
let newsData = [];

// Fetch a single-use token
fetch('/.netlify/functions/generateToken', { method: 'POST' })
  .then(response => response.json())
  .then(tokenData => {
    const token = tokenData.token;

    // Use the token to fetch the API key
    fetch('/.netlify/functions/fetchData', {
      method: 'GET',
      headers: {
        'Authorization': token
      }
    })
    .then(response => response.json())
    .then(data => {
      newsApiKey = data.apiKey2;
    })
    .catch(error => logInteraction('NEWS', 'Error fetching news API key', error.message));
  })
  .catch(error => logInteraction('NEWS', 'Error generating token', error.message));


document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');
  const paginationTop = document.getElementById('pagination-top');
  const paginationBottom = document.getElementById('pagination-bottom');
  const searchButton = document.getElementById('search-button');
  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('category-select');
  const languageSelect = document.getElementById('language-select');
  const backToHomeButton = document.querySelector('.btn-secondary');

  // Unified logging function
  function logInteraction(type, action, error = null) {
    const interactions = JSON.parse(localStorage.getItem('interactions')) || [];
    const index = interactions.length; // Use the length of the array as the index
    const interaction = {
      index: index,
      action: error ? `[${type}] ${action}: ${error}` : `[${type}] ${action}`,
      timestamp: new Date().toISOString()
    };
    interactions.push(interaction);
    localStorage.setItem('interactions', JSON.stringify(interactions));
  }

  logInteraction('NEWS', 'Page loaded');

  // Fetches news data from API
  function fetchNews(keyword = '', category = '', language = 'en') {
    loading.style.display = 'block';
    content.style.display = 'none';
    paginationTop.style.display = 'none';
    paginationBottom.style.display = 'none';

    fetchToken().then(token => {
      let url = `/.netlify/functions/fetchNewsData?country=my&page_size=200`;
      if (keyword) url += `&keywords=${encodeURIComponent(keyword)}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (language) url += `&language=${encodeURIComponent(language)}`;

      fetch(url, {
        method: 'GET',
        headers: { 'Authorization': token } // Use the token to fetch the API data
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.status !== 'ok') {
          throw new Error('API returned an error.');
        }

        newsData = data.news;
        if (newsData.length === 0) {
          throw new Error('No data available for the selected search criteria.');
        }
        displayPage(currentPage);
        loading.style.display = 'none';
        content.style.display = 'flex';
        paginationTop.style.display = 'block';
        paginationBottom.style.display = 'block';
      })
      .catch(error => {
        logInteraction('NEWS', 'Error fetching news data from API', error.message);
        loading.style.display = 'none';
        content.style.display = 'flex';
        content.innerHTML = `<p class="text-danger">${error.message}</p>`;
      });
    });
  }

  // Fetches a single use token for authentication
  function fetchToken() {
    return fetch('/.netlify/functions/generateToken', { method: 'POST' })
      .then(response => response.json())
      .then(tokenData => tokenData.token)
      .catch(error => {
        logInteraction('NEWS', 'Error generating token', error.message);
        throw new Error('Token generation failed');
      });
  }


  function handleSearch() {
    const keyword = searchInput.value;
    const category = categorySelect.value;
    const language = languageSelect.value;
    currentPage = 1; // Reset current page
    logInteraction('USER', `Clicked search button with keyword: "${keyword}", category: "${category}", language: "${language}"`);
    fetchNews(keyword, category, language);
  }

  searchButton.addEventListener('click', handleSearch);

  searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      logInteraction('USER', `Pressed Enter key in search input with keyword: "${searchInput.value}", category: "${categorySelect.value}", language: "${languageSelect.value}"`);
      handleSearch();
    }
  });

  function displayPage(page) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageNews = newsData.slice(start, end);

    let newsHTML = '';
    for (const newsItem of pageNews) {
      const publishedAt = moment(newsItem.published).format('MMMM Do YYYY, h:mm a');
      const imageUrl = newsItem.image ? newsItem.image : '';
      const url = newsItem.url;

      const imageHTML = imageUrl ? `<img src="${imageUrl}" alt="News Image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : '<div class="no-image"></div>';

      newsHTML += `
        <div class="col-md-6">
          <div class="card">
            ${imageHTML}
            <div class="no-image"${imageUrl ? ' style="display:none;"' : ''}></div>
            <div class="card-body">
              <h5 class="card-title">${newsItem.title}</h5>
              <p class="card-text">${newsItem.description ? newsItem.description : 'No description available.'}</p>
              <p class="card-text"><small class="text-muted">Published at: ${publishedAt}</small></p>
              <a href="${url}" target="_blank" class="btn btn-primary read-more-btn">Read more</a>
            </div>
          </div>
        </div>
      `;
    }

    content.innerHTML = newsHTML;
    updatePaginationControls();

    // Add click event listener to "Read more" buttons
    document.querySelectorAll('.read-more-btn').forEach(button => {
      button.addEventListener('click', (event) => {
        const cardBody = event.target.parentElement;
        const title = cardBody.querySelector('.card-title').textContent;
        const url = event.target.href;
        logInteraction('USER', `Read news: Title: "${title}", URL: "${url}"`);
      });
    });
  }

  function updatePaginationControls() {
    const totalPages = Math.ceil(newsData.length / pageSize);
    let paginationHTML = '';

    for (let i = 1; i <= totalPages; i++) {
      paginationHTML += `<button class="btn btn-link${i === currentPage ? ' font-weight-bold' : ''}" onclick="changePage(${i})">${i}</button>`;
    }

    paginationTop.innerHTML = paginationHTML;
    paginationBottom.innerHTML = paginationHTML;

    // Log pagination click events
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

  // Log back to menu button click
  backToHomeButton.addEventListener('click', () => {
    logInteraction('USER', 'Clicked Back to Home Page button');
  });

  // Initial fetch
  fetchNews();
});

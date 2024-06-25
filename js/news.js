// API key
const newsApiKey = 'bzgjvaNFUjA34_M75EwWRUWu-dr0mOPX9FtUTb-XibuXVtr7';

document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');

  function logUserInteraction(action, error = null) {
    const interactions = JSON.parse(localStorage.getItem('interactions')) || [];
    const index = interactions.length; // Use the length of the array as the index
    const interaction = {
      index: index,
      action: error ? `[NEWS] ${action}: ${error}` : `[NEWS] ${action}`,
      timestamp: new Date().toISOString()
    };
    interactions.push(interaction);
    localStorage.setItem('interactions', JSON.stringify(interactions));
  }

  logUserInteraction('Page loaded');

  fetch(`https://api.currentsapi.services/v1/search?country=my&domain=thestar.com.my&page_size=200&apiKey=${newsApiKey}`) // Update the URL to match the actual API URL
  .then(response => {
    logUserInteraction('Fetching news data from API');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.status !== 'ok') {
      throw new Error('API returned an error.');
    }

    // Log user interaction
    logUserInteraction('Fetched news data from API');

    // Hide loading spinner and show content
    loading.style.display = 'none';
    content.style.display = 'flex';

    let newsHTML = '';
    data.news.forEach((newsItem) => {
      const publishedAt = moment(newsItem.published).format('MMMM Do YYYY, h:mm:ss a');
      const imageUrl = newsItem.image ? newsItem.image : '';
      const url = newsItem.url;

      newsHTML += `
        <div class="col-md-6">
          <div class="card">
            ${imageUrl ? `<img src="${imageUrl}" class="card-img-top" alt="News Image">` : '<div class="no-image"></div>'}
            <div class="card-body">
              <h5 class="card-title">${newsItem.title}</h5>
              <p class="card-text">${newsItem.description ? newsItem.description : 'No description available.'}</p>
              <p class="card-text"><small class="text-muted">Published at: ${publishedAt}</small></p>
              <a href="${url}" target="_blank" class="btn btn-primary read-more-btn">Read more</a>
            </div>
          </div>
        </div>
      `;
    });
    content.innerHTML = newsHTML;

    logUserInteraction('Displayed news articles');

    // Add click event listener to "Read more" buttons
    document.querySelectorAll('.read-more-btn').forEach(button => {
      button.addEventListener('click', (event) => {
        logUserInteraction(`Clicked Read more for article: ${event.target.parentElement.querySelector('.card-title').textContent}`);
      });
    });
  })
  .catch(error => {
    logUserInteraction('Error fetching news data from API', error.message);
    loading.style.display = 'none';
    content.style.display = 'flex';
    content.innerHTML = '<p class="text-danger">Failed to load data. Please try again later.</p>';
    logUserInteraction('Displayed error message');
  });
});

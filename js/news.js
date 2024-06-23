// API key
const newsApiKey = '8439f5b7c2d74ac19886e4c16d9c361b';

document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');

  fetch(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${newsApiKey}`)
    .then(response => response.json())
    .then(data => {
      // Hide loading spinner and show content
      loading.style.display = 'none';
      content.style.display = 'flex';

      let newsHTML = '';
      data.articles.forEach(article => {
        const publishedAt = moment(article.publishedAt).format('MMMM Do YYYY, h:mm:ss a');
        newsHTML += `
          <div class="col-md-6">
            <div class="card">
              <img src="${article.urlToImage}" class="card-img-top" alt="News Image">
              <div class="card-body">
                <h5 class="card-title">${article.title}</h5>
                <p class="card-text">${article.description}</p>
                <p class="card-text"><small class="text-muted">Published at: ${publishedAt}</small></p>
                <a href="${article.url}" class="btn btn-primary" target="_blank">Read more</a>
              </div>
            </div>
          </div>
        `;
      });
      content.innerHTML = newsHTML;
    })
    .catch(error => {
      console.error('Error fetching news data:', error);
      loading.innerHTML = '<p class="text-danger">Failed to load data. Please try again later.</p>';
    });
});


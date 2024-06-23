// API key
const newsApiKey = '8439f5b7c2d74ac19886e4c16d9c361b';

document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');

  fetch(`https://newsapi.org/v2/everything?pageSize=100&domains=thestar.com.my&apiKey=${newsApiKey}`)
    .then(response => response.json())
    .then(data => {
      // Hide loading spinner and show content
      loading.style.display = 'none';
      content.style.display = 'flex';

      let newsHTML = '';
      data.articles.forEach((article, index) => {
        const publishedAt = moment(article.publishedAt).format('MMMM Do YYYY, h:mm:ss a');
        const imageUrl = article.urlToImage ? article.urlToImage : '';
        const url = article.url;

        newsHTML += `
          <div class="col-md-6">
            <div class="card">
              ${imageUrl ? `<img src="${imageUrl}" class="card-img-top" alt="News Image">` : '<div class="no-image"></div>'}
              <div class="card-body">
                <h5 class="card-title">${article.title}</h5>
                <p class="card-text">${article.description ? article.description : 'No description available.'}</p>
                <p class="card-text"><small class="text-muted">Published at: ${publishedAt}</small></p>
                <a href="${url}" target="_blank" class="btn btn-primary">Read more</a>
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
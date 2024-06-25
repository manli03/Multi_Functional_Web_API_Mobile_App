document.addEventListener('DOMContentLoaded', function() {
  const apiKey = 'YOUR_API_KEY';
  const newsContainer = document.getElementById('newsContainer');
  
  fetch(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`)
      .then(response => response.json())
      .then(data => {
          const articles = data.articles;
          let html = '';
          articles.forEach(article => {
              html += `
                  <div class="news-article">
                      <h2>${article.title}</h2>
                      <p>${article.description}</p>
                      <a href="${article.url}" target="_blank">Read more</a>
                  </div>
              `;
          });
          newsContainer.innerHTML = html;
          logUserInteraction('Viewed news articles');
      })
      .catch(error => {
          newsContainer.innerHTML = '<p class="text-danger">Failed to load news articles. Please try again later.</p>';
          logUserInteraction('Error fetching news articles', error.message);
      });
});

function logUserInteraction(action, error) {
  const interactionLog = JSON.parse(localStorage.getItem('interactionLog')) || [];
  const logEntry = {
      date: new Date().toLocaleString(),
      action: action,
      error: error || null
  };
  interactionLog.push(logEntry);
  localStorage.setItem('interactionLog', JSON.stringify(interactionLog));
}

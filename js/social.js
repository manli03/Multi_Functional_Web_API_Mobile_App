document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');

  fetch(`https://www.reddit.com/r/malaysia/top/.json?limit=5`)
    .then(response => response.json())
    .then(data => {
      // Hide loading spinner and show content
      loading.style.display = 'none';
      content.style.display = 'flex';

      let socialHTML = '';
      data.data.children.forEach(post => {
        const created = moment.unix(post.data.created).format('MMMM Do YYYY, h:mm:ss a');
        socialHTML += `
          <div class="col-md-6">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">${post.data.title}</h5>
                <p class="card-text">${post.data.selftext ? post.data.selftext : 'No content'}</p>
                <a href="${post.data.url}" class="btn btn-primary" target="_blank">Read more</a>
                <p class="card-text"><small class="text-muted">Posted at: ${created} | Upvotes: ${post.data.ups}</small></p>
              </div>
            </div>
          </div>
        `;
      });
      content.innerHTML = socialHTML;
    })
    .catch(error => {
      console.error('Error fetching social media data:', error);
      loading.innerHTML = '<p class="text-danger">Failed to load data. Please try again later.</p>';
    });
});

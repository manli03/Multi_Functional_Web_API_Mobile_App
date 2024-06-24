document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');

  function logUserInteraction(action, error = null) {
    const interactions = JSON.parse(localStorage.getItem('interactions')) || [];
    const index = interactions.length; // Use the length of the array as the index
    const interaction = {
      index: index,
      action: error ? `[SOCIAL] ${action}: ${error}` : `[SOCIAL] ${action}`,
      timestamp: new Date().toISOString()
    };
    interactions.push(interaction);
    localStorage.setItem('interactions', JSON.stringify(interactions));
  }

  logUserInteraction('Page loaded');

  fetch(`https://www.reddit.com/r/malaysia/top/.json?limit=10`)
    .then(response => {
      logUserInteraction('Fetching social media data from API');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Log user interaction
      logUserInteraction('Fetched social media data from API');

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
      logUserInteraction('Displayed social media posts');
    })
    .catch(error => {
      logUserInteraction('Error fetching social media data from API', error.message);
      loading.style.display = 'none';
      content.style.display = 'flex';
      content.innerHTML = '<p class="text-danger">Failed to load data. Please try again later.</p>';
      logUserInteraction('Displayed error message');
    });
});
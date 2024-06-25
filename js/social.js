document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');

  const client_id = 'prOHeuyKyZfLk94Hhl43ow';
  const client_secret = 'HiPgmZAvbwXEjq4XgTBk3_v9g9QdhA';
  const auth = btoa(`${client_id}:${client_secret}`);
  
  function logUserInteraction(action, error = null) {
    const interactions = JSON.parse(localStorage.getItem('interactions')) || [];
    const index = interactions.length;
    const interaction = {
      index: index,
      action: error ? `[SOCIAL] ${action}: ${error}` : `[SOCIAL] ${action}`,
      timestamp: new Date().toISOString()
    };
    interactions.push(interaction);
    localStorage.setItem('interactions', JSON.stringify(interactions));
  }

  logUserInteraction('Page loaded');

  // Get bearer token
  fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })
  .then(response => response.json())
  .then(data => {
    const token = data.access_token;

    // Fetch Reddit posts
    return fetch('https://oauth.reddit.com/r/malaysia/top/.json?limit=10', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  })
  .then(response => {
    logUserInteraction('Fetching social media data from API');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    logUserInteraction('Fetched social media data from API');

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
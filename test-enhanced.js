fetch('/api/test/enhanced-post', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    projects: [{
      id: "test-direct",
      name: "Direct Test", 
      color: "#FF0000"
    }]
  })
})
.then(response => response.json())
.then(data => console.log('Test result:', data))
.catch(error => console.error('Test error:', error));

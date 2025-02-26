document.addEventListener('DOMContentLoaded', () => {
  const issueForm = document.getElementById('issueForm');
  const solutionsSection = document.getElementById('solutionsSection');
  const solutionsList = document.getElementById('solutionsList');
  const feedbackForm = document.getElementById('feedbackForm');

  issueForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const issueDescription = document.getElementById('issue').value;

      try {
          const response = await fetch('/api/get-solutions', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ problem: issueDescription }),
          });

          if (response.ok) {
              const data = await response.json();
              displaySolutions(data.solutions);
          } else {
              console.error('Error fetching solutions');
          }
      } catch (error) {
          console.error('Error:', error);
      }
  });

  feedbackForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const feedback = document.getElementById('feedback').value;
      const selectedSolutionIds = feedback.split(',').map(num => parseInt(num.trim()));

      try {
          const response = await fetch('/api/submit-feedback', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ solutionIds: selectedSolutionIds }),
          });

          if (response.ok) {
              alert('Thank you for your feedback!');
          } else {
              console.error('Error submitting feedback');
          }
      } catch (error) {
          console.error('Error:', error);
      }
  });

  function displaySolutions(solutions) {
      solutionsList.innerHTML = '';
      solutions.forEach((solution, index) => {
          const listItem = document.createElement('li');
          listItem.textContent = solution.text;
          solutionsList.appendChild(listItem);
      });
      solutionsSection.style.display = 'block';
  }
});

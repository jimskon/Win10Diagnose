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
              const diagnosis = data.solutions[0].solution_text.trim()
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
                .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italics
                .replace(/\n/g, "<br>"); // Line breaks for better readability  
              console.log("solutions1:",diagnosis);

              displaySolutions(diagnosis);
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
      console.log("solutions2:",solutions);
      solutionsList.innerHTML = solutions;
      /*solutions.forEach((solution, index) => {
          const listItem = document.createElement('li');
          listItem.textContent = solution.text;
          solutionsList.appendChild(listItem);
      });*/
      solutionsSection.style.display = 'block';
  }
});

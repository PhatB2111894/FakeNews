import React from 'react';
import { Container, Card } from 'react-bootstrap';

function AboutPage() {
  return (
    <Container className="mt-4 mb-5">
      <Card className="p-4 shadow-sm">
        <Card.Body>
          <Card.Title as="h2" className="mb-3 text-dark"><i className="fas fa-info-circle me-2"></i>About Us</Card.Title>
          <hr/>
          <p>
            Welcome to the <strong>Fake News Detector</strong> application! Our mission is to combat the spread of misinformation by providing users with a tool to assess the likelihood of news articles being fake or real.
          </p>
          <p>
            Using advanced machine learning models trained on diverse datasets, we analyze the text content you provide to estimate its authenticity probability and sentiment.
          </p>

          <h4 className="mt-4">Our Goal</h4>
          <p>
            We aim to empower users with insights, encouraging critical evaluation of news sources and promoting a more informed public discourse. This tool serves as an aid, not a definitive judgment, and should be used alongside your own critical thinking and fact-checking efforts.
          </p>

          <h4 className="mt-4">Key Features</h4>
          <ul>
            <li>Real/Fake news classification with probability scores.</li>
            <li>Sentiment analysis of the news text.</li>
            <li>(Optional) Highlighting influential words contributing to the classification.</li>
            <li>User history tracking for logged-in users.</li>
            {/* Add more features specific to your app */}
          </ul>

           <h4 className="mt-4">Technology</h4>
           <p>
             Built with React, Node.js, Express, MongoDB, and Python (Flask) for the ML backend.
           </p>

          <p className="mt-4 text-muted fst-italic">
            Thank you for using our application! We are continuously working to improve its accuracy and features.
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AboutPage;
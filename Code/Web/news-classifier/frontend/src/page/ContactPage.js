import React from 'react';
// Đã import Alert, Spinner từ đầu nên không cần thêm
import { Container, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';

function ContactPage() {
  // Basic state for a contact form (optional)
  const [formData, setFormData] = React.useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitMessage, setSubmitMessage] = React.useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');
    // Here you would typically send the form data to your backend or a service
    console.log("Form data submitted:", formData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setSubmitMessage('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', message: '' }); // Clear form
  };

  return (
    <Container className="mt-4 mb-5">
       <Card className="p-4 shadow-sm">
        <Card.Body>
           <Card.Title as="h2" className="mb-3 text-primary"><i className="fas fa-envelope me-2"></i>Contact Us</Card.Title>
          <hr/>
          <p>
            Have questions, feedback, or suggestions for the <strong>Fake News Detector</strong> app? We'd love to hear from you! Please use the form below or contact us directly via email.
          </p>
          <p>
            {/* <<<--- ĐÃ CẬP NHẬT EMAIL Ở ĐÂY --->>> */}
            <strong>Email:</strong> <a href="mailto:nguyenhongtuanphat24@gmail.com">nguyenhongtuanphat24@gmail.com</a>
          </p>
          {/* Optional Contact Form */}
          <h4 className="mt-4">Send us a Message</h4>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="contactFormName">
              <Form.Label>Your Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your name" />
            </Form.Group>

            <Form.Group className="mb-3" controlId="contactFormEmail">
              <Form.Label>Your Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                 value={formData.email}
                 onChange={handleChange}
                 required
                 placeholder="Enter your email" />
            </Form.Group>

            <Form.Group className="mb-3" controlId="contactFormMessage">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                placeholder="Your message here..." />
            </Form.Group>

            {submitMessage && <Alert variant={submitMessage.includes('Thank you') ? 'success' : 'danger'}>{submitMessage}</Alert>}

            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Sending...</> : 'Send Message'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ContactPage;
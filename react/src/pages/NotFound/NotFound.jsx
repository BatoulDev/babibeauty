import React from 'react';
export default function NotFound() {
  return (
    <div className="container text-center py-5">
      <h1 className="display-4">404</h1>
      <p className="lead">Sorry, the page you are looking for does not exist.</p>
      <a href="/" className="btn btn-primary">Go Home</a>
    </div>
  );
}

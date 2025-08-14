# BabiBeauty API – Project Proposal

## 1. Introduction
BabiBeauty is an online beauty and lifestyle platform designed to connect customers with beauty experts, brands, and products. The proposed API service will serve as the backend system powering web and mobile applications, enabling seamless user experiences for product browsing, booking beauty services, and managing orders.

This API will be built following **RESTful principles**, ensuring scalability, security, and maintainability. It will be the single source of truth for all application data and provide endpoints for authenticated and unauthenticated users.

---

## 2. Objectives
The main objectives of the BabiBeauty API are to:

- Provide secure user registration, authentication, and authorization.
- Enable product and brand browsing with category-based filtering.
- Support bookings with beauty experts, including time and price management.
- Allow users to place and track orders for beauty products.
- Facilitate customer reviews for both products and beauty experts.
- Ensure data integrity and security through best practices.

---

## 3. Core Entities
Based on the **Entity-Relationship Diagram (ERD)**, the core entities include:

- **Users** – customers and administrators.
- **Beauty Experts** – professionals providing services.
- **Brands** – beauty product brands.
- **Categories** – hierarchical classification for products.
- **Products** – beauty and skincare items.
- **Reviews** – user feedback for products or experts (polymorphic).
- **Bookings** – appointments with beauty experts.
- **Orders** – customer purchase records.

---

## 4. Main Functionalities

### 4.1 User Management
- Register new users with secure password hashing.
- Login and receive authentication tokens.
- Update profile details and change passwords.
- Role-based access control (Admin vs. User).

### 4.2 Product & Brand Management
- View all products with pagination and filtering by category, brand, price, and availability.
- View individual product details.
- Manage brands (Admin).
- Manage product details (Admin).

### 4.3 Category Management
- View all categories (including parent-child relationships).
- Add, edit, and delete categories (Admin).

### 4.4 Booking System
- Create bookings with beauty experts.
- Update or cancel bookings.
- View expert availability.
- View booking history for a user.

### 4.5 Orders Management
- Create an order from a cart.
- View past orders.
- Update order status (Admin).
- Calculate total prices with taxes and discounts.

### 4.6 Review System
- Post reviews for products or beauty experts.
- View reviews for specific products or experts.
- Edit or delete reviews (owner only).

---

## 5. API Architecture
- **Architecture Style:** RESTful API.
- **Format:** JSON request/response.
- **Authentication:** JWT (JSON Web Tokens) with Laravel Sanctum.
- **Security Measures:**
  - Input validation & sanitization.
  - Role-based middleware.
  - HTTPS for data transmission.
- **Versioning:** `/api/v1/` prefix for endpoints.

---

## 6. Example Endpoints

| Method | Endpoint                | Description           |
|--------|-------------------------|-----------------------|
| POST   | `/api/register`         | Register a new user   |
| POST   | `/api/login`            | Authenticate a user   |
| GET    | `/api/products`         | List all products     |
| GET    | `/api/products/{id}`    | Get product details   |
| GET    | `/api/categories`       | List categories       |
| POST   | `/api/bookings`         | Create booking        |
| GET    | `/api/orders`           | View user orders      |
| POST   | `/api/reviews`          | Submit a review       |

---

## 7. Expected Benefits
- **For Customers:** Easy access to products and services, smooth booking process, and reliable order tracking.
- **For Admins:** Centralized management of products, services, bookings, and orders.
- **For Beauty Experts:** Streamlined booking management and direct customer engagement.

---

## 8. Timeline

| Phase            | Duration  | Description                                      |
|------------------|-----------|--------------------------------------------------|
| Planning & Design| 1 week    | Finalize ERD, endpoints, and authentication flow |
| Backend Setup    | 1 week    | Laravel project setup, authentication, base endpoints |
| Core Features    | 2 weeks   | Products, bookings, orders, reviews              |
| Testing & Deployment | 1 week | Unit testing, API documentation, deployment      |

---

## 9. Conclusion
The BabiBeauty API will be the backbone of a modern, efficient, and scalable beauty platform. By adhering to secure coding standards, maintaining clear separation of concerns, and following REST principles, the service will ensure a high-quality user experience and support future growth.

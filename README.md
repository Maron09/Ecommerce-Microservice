# 🛍️ E-Commerce Microservices System

A **scalable, event-driven e-commerce platform** built with a microservices architecture using **Node.js**, **Express**, **MongoDB**, **RabbitMQ**, and **Paystack** for payments.  
This project showcases a distributed system design where independent services handle different business domains — enabling better scalability, maintainability, and fault isolation.

---

## 🚀 Overview

This system demonstrates a modular e-commerce backend, where each service operates independently and communicates asynchronously through **RabbitMQ**.  
It’s designed for portfolio and production-level demonstration — combining clean code practices, microservice patterns, and real payment integration.

---

## 🧩 Services Breakdown

| Service | Description |
|----------|-------------|
| **API Gateway** | Central entry point. Handles routing, authentication, and request forwarding to respective services. |
| **Auth Service** | Manages user registration, login, JWT authentication, and role-based access control (customer, vendor, admin). |
| **Customer Service** | Handles customer profile, preferences, and order history. |
| **Vendor Service** | Manages vendor registration, store setup, and payout configurations (including Paystack subaccounts). |
| **Cart Service** | Handles cart creation, item addition/removal, and cart persistence per customer session. |
| **Order Service** | Coordinates order creation, status updates, and fulfillment workflows. |
| **Product Service** | Manages product listing, stock updates, categories, and vendor associations. |
| **Inventory Service** | Tracks product stock levels and updates them based on order activity. |
| **Payment Service** | Integrates with **Paystack** for secure transactions and automatic vendor payment splits. |
| **Notification Service** | Sends real-time notifications (email/SMS) for order confirmations, payment updates, and vendor alerts. |
| **Admin Service** | Provides administrative controls for monitoring, approving vendors, and managing platform data. |

---

## 🧠 Architecture

The project is designed around **microservice principles**:

- 🕸 **Event-driven communication** via **RabbitMQ**
- 🧱 **Independent MongoDB databases** for each service
- 🔐 **JWT-based Authentication** (managed by the Auth Service)
- 💳 **Paystack Integration** for real payments and vendor split handling
- ⚙️ **API Gateway** for unified request management
- 💬 **Asynchronous messaging** for decoupled service interactions
- 🧩 **Scalable microservices** that can run separately or as a cluster

---

## 📦 Tech Stack

| Category | Technology |
|-----------|-------------|
| **Language** | Node.js (ES Modules) |
| **Framework** | Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Message Broker** | RabbitMQ |
| **Payment Integration** | Paystack |
| **Authentication** | JWT |
| **Logging** | Winston-based logger |
| **Containerization (optional)** | Docker & Docker Compose |

---

## 💳 Payment Flow (Paystack Integration)

1. **Customer places an order** via the API Gateway.  
2. The **Order Service** creates the order and publishes a message to RabbitMQ.  
3. The **Payment Service** initializes a Paystack transaction with split details for vendors.  
4. Upon successful payment, Paystack calls the **/verify** endpoint.  
5. The **Payment Service** verifies the transaction, updates the order via the **Order Service**, and publishes a payment completion event.  
6. **Notification Service** informs the customer and vendor of the payment status.

---

## 📨 RabbitMQ Message Flow

| Event | Publisher | Subscriber(s) | Description |
|--------|------------|---------------|--------------|
| `order.created` | Order Service | Payment, Inventory | Triggered when an order is created. |
| `payment.completed` | Payment Service | Order, Notification | Triggered when a payment is verified. |
| `inventory.updated` | Inventory Service | Order | Adjusts stock levels after successful order. |
| `vendor.payout` | Payment Service | Vendor | Handles Paystack vendor split confirmation. |

---

## 🗂️ Directory Structure (Example)

ecommerce-microservices/
│
├── api-gateway/
│ ├── routes/
│ ├── middlewares/
│ └── server.js
│
│ ├── auth/
│ ├── cart/
│ ├── customer/
│ ├── vendor/
│ ├── order/
│ ├── product/
│ ├── inventory/
│ ├── payments/
│ ├── notification/
│ └── admin/
│
│
└── README.md


```bash
git clone https://github.com/maron09/Ecommerce-Microservice.git
cd ecommerce-microservices
```
```bash
npm install
```
## Each service has its own .env file. Example for Payment Service: 
- PORT=5007
- MONGO_URI=mongodb://localhost:27017/payment
- RABBITMQ_URL=amqp://localhost
- PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
- PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx

## 🏁 Future Improvements
1. ✅ Add Analytics to track performance

2. ✅ Integrate Kubernetes for deployment orchestration.

3. ✅ Add unit/integration tests (Jest + Supertest).


## 🧑‍💻 Author

**Ezra**
- Backend Developer (Python, Node.js)
- Building scalable systems with clean architecture & efficient APIs.


## 🏗️ License
-  This project is licensed under the MIT License — feel free to use and modify it for learning or production.
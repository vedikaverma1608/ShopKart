# ShopKart

A MERN e-commerce application built against the Lab 01–06 problem statements:
authentication, product catalogue, wishlist, cart, checkout and order history,
with Razorpay Test Mode payments.

```
Register / Login  →  Browse & Search  →  Wishlist  →  Cart
      →  Checkout  →  Razorpay Test Payment  →  Signature Verification
      →  Order PLACED  →  Order History
```

## Stack

| Layer | Choice |
|---|---|
| Backend | Node.js, Express, MongoDB, Mongoose |
| Auth | bcrypt + jsonwebtoken, JWT in an HttpOnly cookie |
| Frontend | React, React Router, Context API, Axios |
| Payments | Razorpay Standard Checkout (Test Mode) |
| Styling | Plain CSS — no UI framework |

No Passport, Clerk, Firebase, Auth0 or Redux, per the lab constraints.

## Running it

MongoDB must be running locally (`brew services start mongodb-community`).

```bash
# Backend — http://localhost:5001
cd backend
npm install
cp .env.example .env     # then fill in your Razorpay test keys
npm run seed             # 20 products + a demo customer
npm run dev

# Frontend — http://localhost:5173
cd frontend
npm install
cp .env.example .env
npm run dev
```

Demo login after seeding: `aarav@shopkart.com` / `aarav123`

> **Port note:** the backend listens on **5001**, not 5000. macOS runs AirPlay
> Receiver on port 5000, which silently answers requests with a 403.

## Tests

```bash
cd backend && npm test
```

46 assertions covering the Postman test plans from every lab — registration and
duplicate rejection, bcrypt storage, cookie auth, search and filter combinations,
wishlist duplicate prevention, cart quantity and stock limits, order snapshots,
and the payment signature path including a forged-signature attempt.

Requires the server running and the database seeded. It cleans up after itself.

## API

| Method | Endpoint | Auth | Purpose |
|---|---|:---:|---|
| POST | `/customers/register` | | Create an account |
| POST | `/customers/login` | | Log in, sets the auth cookie |
| GET | `/customers/me` | ✅ | Current customer |
| POST | `/customers/logout` | ✅ | Clear the auth cookie |
| PATCH | `/customers/change-password` | ✅ | Change password *(bonus)* |
| POST | `/products` | | Create a product |
| GET | `/products` | | List, `?search=&category=&sort=` |
| GET | `/products/categories` | | Distinct categories |
| GET | `/products/:id` | | Single product |
| POST | `/wishlist/:productId` | ✅ | Save a product |
| GET | `/wishlist` | ✅ | Current customer's wishlist |
| DELETE | `/wishlist/:productId` | ✅ | Remove a product |
| PATCH | `/wishlist/:productId/toggle` | ✅ | Toggle *(bonus)* |
| POST | `/cart/:productId` | ✅ | Add, or increment quantity |
| GET | `/cart` | ✅ | Current customer's cart |
| PATCH | `/cart/:productId` | ✅ | Set quantity |
| DELETE | `/cart/:productId` | ✅ | Remove a line |
| POST | `/orders/create-payment-order` | ✅ | Validate, price, create both orders |
| POST | `/orders/verify-payment` | ✅ | Verify signature, mark PAID, clear cart |
| GET | `/orders` | ✅ | Order history, newest first |
| GET | `/orders/:id` | ✅ | One order, ownership enforced |
| PATCH | `/orders/:id/payment-failed` | ✅ | Mark a cancelled attempt FAILED |
| PATCH | `/orders/:id/status` | ✅ | Status progression *(bonus)* |

Sorting accepts `price_asc`, `price_desc`, `newest`.

## Design decisions

**One customer model.** Labs 01–02 call the collection `Customer`; Labs 04–06
call the same document `User`. It is one model, `Customer`, holding the wishlist
and cart. The `Order` model therefore uses `ref: "Customer"`.

**Wishlist and cart store references, not copies.** The wishlist is an array of
Product ObjectIds; a cart row is `{ product, quantity }`. Product stays the
source of truth, so a price change needs no write anywhere else.

**Orders store a snapshot.** Order items copy `name`, `price` and `image` at
purchase time, which is the opposite of the cart on purpose: an order must still
read correctly a year later when the product costs something different.

**Totals are derived, never persisted.** Subtotal and cart count are computed
from state on the frontend and recomputed from current prices on the backend at
checkout. Anything the client sends as a total is ignored.

**The server owns the payment.** `create-payment-order` re-reads every product,
re-checks stock, recalculates the total and creates the Razorpay order. The HMAC
in `verify-payment` is built from the Razorpay order id **stored in MongoDB**,
not the one posted back by the browser, and the comparison is timing-safe. The
cart clears only after that verification succeeds.

**Auth transport.** The JWT travels in an HttpOnly cookie, so page JavaScript
cannot read it. The middleware also accepts a Bearer header purely so the API can
be exercised from Postman without a cookie jar.

**Three contexts, not one.** `AuthContext` owns the session, `CartContext` the
cart, `WishlistContext` the saved products. Every cart mutation endpoint returns
the entire cart, so the context assigns it wholesale — the navbar count and the
cart page read the same state and cannot drift apart.

## Not built

- **Stock is never decremented.** Checkout verifies stock but does not reduce it;
  the labs specify the check and never ask for the decrement.
- **No admin role.** Product creation is an open endpoint, as Lab 03 specifies.
- **Razorpay webhooks.** Payment is confirmed only through the browser's
  verification round-trip. A real store would also accept a server-side webhook
  so a payment that succeeds after the user closes the tab still lands.
- **No pagination.** The catalogue is a fixed 20 products; a real one would need
  it.
- **Images are placeholder photos** from picsum.photos. The schema stores a URL
  string, so real product images drop in without a code change.

import { useCallback, useEffect, useState } from "react";
import ProductCard from "../components/ProductCard.jsx";
import StateMessage from "../components/StateMessage.jsx";
import api, { errorMessage } from "../services/api.js";

const SORT_OPTIONS = [
  { value: "", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Category options come from the database, so a new category needs no code change.
  useEffect(() => {
    api
      .get("/products/categories")
      .then(({ data }) => setCategories(data.categories))
      .catch(() => setCategories([]));
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Filtering runs on the server: the browser never pulls the whole
      // catalogue just to narrow it down locally.
      const { data } = await api.get("/products", {
        params: {
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(category !== "All" ? { category } : {}),
          ...(sort ? { sort } : {}),
        },
      });

      setProducts(data.products);
    } catch (err) {
      setError(errorMessage(err, "Something went wrong while loading products."));
    } finally {
      setLoading(false);
    }
  }, [search, category, sort]);

  // Typing is debounced so each keystroke does not become its own request.
  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  return (
    <main className="page">
      <header className="page__header">
        <div>
          <h1>Products</h1>
          <p className="page__subtitle">
            {loading ? "Loading..." : `${products.length} products available`}
          </p>
        </div>
      </header>

      <section className="filters" aria-label="Product filters">
        <div className="field field--inline">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="field field--inline">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="field field--inline">
          <label htmlFor="sort">Sort by</label>
          <select id="sort" value={sort} onChange={(event) => setSort(event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {loading && <StateMessage title="Loading products..." />}

      {!loading && error && (
        <StateMessage
          icon="⚠️"
          title="Something went wrong while loading products."
          actionLabel="Try Again"
          onAction={loadProducts}
        />
      )}

      {!loading && !error && products.length === 0 && (
        <StateMessage
          icon="🔍"
          title="No products found."
          description="Try a different search term or category."
        />
      )}

      {!loading && !error && products.length > 0 && (
        <section className="card-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </section>
      )}
    </main>
  );
};

export default Products;

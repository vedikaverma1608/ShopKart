import WishlistCard from "../components/WishlistCard.jsx";
import StateMessage from "../components/StateMessage.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";

const Wishlist = () => {
  const { items, loading, error, refreshWishlist } = useWishlist();

  if (loading) return <StateMessage title="Loading your wishlist..." />;

  if (error) {
    return (
      <StateMessage
        icon="⚠️"
        title="Something went wrong."
        description="We couldn't load your wishlist."
        actionLabel="Try Again"
        onAction={refreshWishlist}
      />
    );
  }

  if (items.length === 0) {
    return (
      <StateMessage
        icon="❤️"
        title="Your wishlist is empty"
        description="Save products you love and find them here later."
        actionLabel="Browse Products"
        actionTo="/products"
      />
    );
  }

  return (
    <main className="page">
      <header className="page__header">
        <div>
          <h1>My Wishlist</h1>
          <p className="page__subtitle">
            {items.length} {items.length === 1 ? "product" : "products"} saved
          </p>
        </div>
      </header>

      <section className="card-grid">
        {items.map((product) => (
          <WishlistCard key={product._id} product={product} />
        ))}
      </section>
    </main>
  );
};

export default Wishlist;

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// Loaded on demand rather than in index.html, and the failure case is reported
// instead of assuming window.Razorpay will be there.
export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });

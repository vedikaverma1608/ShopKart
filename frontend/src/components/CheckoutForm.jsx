const FIELDS = [
  { name: "fullName", label: "Full Name", type: "text", autoComplete: "name" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel", maxLength: 10 },
  { name: "addressLine1", label: "Address", type: "text", autoComplete: "street-address" },
  { name: "city", label: "City", type: "text", autoComplete: "address-level2" },
  { name: "state", label: "State", type: "text", autoComplete: "address-level1" },
  { name: "pincode", label: "Pincode", type: "text", autoComplete: "postal-code", maxLength: 6 },
];

const CheckoutForm = ({ values, errors, onChange }) => (
  <fieldset className="checkout-form">
    <legend>Shipping Details</legend>

    {FIELDS.map(({ name, label, type, ...rest }) => (
      <div className="field" key={name}>
        <label htmlFor={name}>{label}</label>

        <input
          id={name}
          name={name}
          type={type}
          value={values[name]}
          onChange={(event) => onChange(name, event.target.value)}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
          {...rest}
        />

        {errors[name] && (
          <p className="field__error" id={`${name}-error`}>
            {errors[name]}
          </p>
        )}
      </div>
    ))}
  </fieldset>
);

export default CheckoutForm;

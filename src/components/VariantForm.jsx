import React from "react";

const emptyVariant = {
  size: "",
  color: "",
  material: "",
  printType: "",
  finish: "",
  shape: "",
  width: "",
  height: "",
  unit: "cm",
  waterproof: false,
  stock: 0,
  sku: "",
  priceModifier: 0
};

const clothingTypes = ["tshirt", "hoodie", "oversized-tshirt"];
const stickerTypes = ["sticker", "label"];

export const createEmptyVariant = () => ({ ...emptyVariant });

const normalizeVariant = (variant) => ({ ...emptyVariant, ...variant });

const VariantForm = ({ basePrice, productType, variants, onChange }) => {
  const isClothing = clothingTypes.includes(productType);
  const isSticker = stickerTypes.includes(productType);

  const updateVariant = (index, field, value) => {
    const nextVariants = variants.map((variant, variantIndex) =>
      variantIndex === index ? { ...variant, [field]: value } : variant
    );
    onChange(nextVariants);
  };

  const addVariant = () => {
    onChange([...variants, createEmptyVariant()]);
  };

  const removeVariant = (index) => {
    onChange(variants.filter((variant, variantIndex) => variantIndex !== index));
  };

  return (
    <section className="variant-section">
      <div className="row-heading">
        <div>
          <h2>Variants</h2>
          <p>Configure purchasable options, stock, SKU, and price adjustments.</p>
        </div>
        <button className="secondary-button" type="button" onClick={addVariant}>
          Add Variant
        </button>
      </div>

      {!variants.length && isClothing ? (
        <div className="form-alert">At least one variant is required for clothing products.</div>
      ) : null}

      <div className="variant-list">
        {variants.map((rawVariant, index) => {
          const variant = normalizeVariant(rawVariant);
          const displayPrice = Number(basePrice || 0) + Number(variant.priceModifier || 0);

          return (
            <div className="variant-card" key={index}>
              <div className="row-heading">
                <h3>Variant {index + 1}</h3>
                <button className="secondary-button" type="button" onClick={() => removeVariant(index)}>
                  Remove Variant
                </button>
              </div>

              <div className="form-grid">
                {isSticker ? (
                  <>
                    <label>
                      Shape
                      <input value={variant.shape} onChange={(event) => updateVariant(index, "shape", event.target.value)} />
                    </label>
                    <label>
                      Width
                      <input
                        min="0"
                        type="number"
                        value={variant.width}
                        onChange={(event) => updateVariant(index, "width", event.target.value)}
                      />
                    </label>
                    <label>
                      Height
                      <input
                        min="0"
                        type="number"
                        value={variant.height}
                        onChange={(event) => updateVariant(index, "height", event.target.value)}
                      />
                    </label>
                    <label>
                      Unit
                      <select value={variant.unit} onChange={(event) => updateVariant(index, "unit", event.target.value)}>
                        <option value="mm">mm</option>
                        <option value="cm">cm</option>
                        <option value="inch">inch</option>
                      </select>
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      Size
                      <input value={variant.size} onChange={(event) => updateVariant(index, "size", event.target.value)} />
                    </label>
                    <label>
                      Color
                      <input value={variant.color} onChange={(event) => updateVariant(index, "color", event.target.value)} />
                    </label>
                    <label>
                      Print type
                      <input
                        value={variant.printType}
                        onChange={(event) => updateVariant(index, "printType", event.target.value)}
                      />
                    </label>
                  </>
                )}

                <label>
                  Material
                  <input value={variant.material} onChange={(event) => updateVariant(index, "material", event.target.value)} />
                </label>
                <label>
                  Finish
                  <input value={variant.finish} onChange={(event) => updateVariant(index, "finish", event.target.value)} />
                </label>
                <label>
                  Stock
                  <input
                    min="0"
                    type="number"
                    value={variant.stock}
                    onChange={(event) => updateVariant(index, "stock", event.target.value)}
                  />
                </label>
                <label>
                  SKU
                  <input value={variant.sku} onChange={(event) => updateVariant(index, "sku", event.target.value)} />
                </label>
                <label>
                  Price modifier
                  <input
                    type="number"
                    value={variant.priceModifier}
                    onChange={(event) => updateVariant(index, "priceModifier", event.target.value)}
                  />
                </label>
                <label>
                  Display price
                  <input value={`Rs. ${displayPrice.toLocaleString("en-IN")}`} readOnly />
                </label>
              </div>

              {isSticker ? (
                <div className="checkbox-row">
                  <label>
                    <input
                      checked={Boolean(variant.waterproof)}
                      type="checkbox"
                      onChange={(event) => updateVariant(index, "waterproof", event.target.checked)}
                    />
                    Waterproof
                  </label>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default VariantForm;

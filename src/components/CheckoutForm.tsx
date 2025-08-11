import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useFinance, type SubscriptionPlan } from "@/context/financeContext";

interface CheckoutFormProps {
  plan: SubscriptionPlan;
  autoRenew: boolean;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#9e2146",
    },
  },
};

export default function CheckoutForm({ plan, autoRenew, onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { purchasePlan, confirmStripePayment } = useFinance();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe is not loaded. Please refresh the page.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create payment intent with our backend
      console.log("Creating payment intent for plan:", plan.id);
      const paymentResult = await purchasePlan(plan.id, { autoRenew });
      
      if (!paymentResult.client_secret) {
        throw new Error("Failed to create payment intent");
      }

      console.log("Payment intent created, confirming with Stripe...");

      // Step 2: Confirm the payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        paymentResult.client_secret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              // You can add billing details here if needed
            },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message || "Payment failed");
      }

      if (paymentIntent.status === "succeeded") {
        console.log("Stripe payment succeeded, confirming with backend...");
        
        // Step 3: Confirm payment with our backend to create subscription
        const result = await confirmStripePayment(plan.id, paymentIntent.id);
        
        if (result.subscription) {
          console.log("Subscription created successfully");
          onSuccess();
        } else {
          throw new Error("Failed to create subscription");
        }
      } else {
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Payment failed";
      console.error("Payment error:", err);
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="border border-gray-300 rounded-md p-3">
            <CardElement options={cardElementOptions} />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Use test card: 4242 4242 4242 4242, any future expiry, any CVC
          </p>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        <div className="bg-gray-50 rounded-md p-4">
          <div className="flex justify-between items-center text-sm">
            <span>Plan:</span>
            <span className="font-medium">{plan.name}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span>Minutes:</span>
            <span className="font-medium">{plan.minutes.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span>Total:</span>
            <span className="font-bold text-lg">${plan.price}</span>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full btn-theme-gradient"
      >
        {loading ? "Processing..." : `Pay $${plan.price}`}
      </Button>

      <div className="text-xs text-gray-500 text-center">
        Your payment is secured by Stripe. We never store your card details.
      </div>
    </form>
  );
}

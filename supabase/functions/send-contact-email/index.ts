import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  message?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const formData: ContactFormData = await req.json();
    const { name, email, phone, address, message } = formData;

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "Nome e email sono obbligatori" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const resend = new Resend("re_LftgamMe_4mVJFDNMgcvQVv7E9t5wYewK");

    const { data, error } = await resend.emails.send({
      from: "Sgomberami <onboarding@resend.dev>",
      to: "riccardo@sgomberamiristrutturazioni.com",
      subject: `Nuova richiesta preventivo da ${name}`,
      html: `
        <h2>Nuova richiesta di preventivo</h2>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Telefono:</strong> ${phone}</p>` : ""}
        ${address ? `<p><strong>Indirizzo cantiere:</strong> ${address}</p>` : ""}
        ${message ? `<p><strong>Messaggio:</strong></p><p>${message}</p>` : ""}
      `,
    });

    if (error) {
      console.error("Errore Resend:", error);
      return new Response(
        JSON.stringify({ error: "Errore nell'invio dell'email" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Errore:", error);
    return new Response(
      JSON.stringify({ error: "Errore interno del server" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
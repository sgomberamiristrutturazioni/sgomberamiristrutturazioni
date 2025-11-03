import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    const placeId = Deno.env.get('GOOGLE_PLACE_ID');

    if (!apiKey || !placeId) {
      throw new Error('Missing API key or Place ID configuration');
    }

    // Using new Places API (New)
    const url = `https://places.googleapis.com/v1/places/${placeId}?fields=displayName,rating,userRatingCount,reviews&languageCode=it&key=${apiKey}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();

    if (!response.ok) {
      console.error('Google API error:', data);
      throw new Error(`Google API error: ${data.error?.message || response.statusText}`);
    }

    const reviews = data.reviews || [];

    const responseData = {
      rating: data.rating || 0,
      total_reviews: data.userRatingCount || 0,
      reviews: reviews.map((review: any) => ({
        author_name: review.authorAttribution?.displayName || 'Anonimo',
        rating: review.rating || 0,
        text: review.text?.text || '',
        time: review.publishTime ? new Date(review.publishTime).getTime() / 1000 : 0,
        profile_photo_url: review.authorAttribution?.photoUri || 'https://via.placeholder.com/48'
      })).slice(0, 5)
    };

    return new Response(JSON.stringify(responseData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch reviews',
        rating: 0,
        total_reviews: 0,
        reviews: []
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
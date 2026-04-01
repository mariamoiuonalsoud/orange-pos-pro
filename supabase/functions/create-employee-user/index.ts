// @ts-expect-error: Deno module
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// @ts-expect-error: Deno runtime
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    // @ts-expect-error: Deno environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    // @ts-expect-error: Deno environment
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action, email, password, role, fullName, auth_id } = body;

    if (action === "create") {
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role, full_name: fullName },
      });
      if (error) throw error;
      return Response.json({ userId: data.user.id }, { status: 200, headers: corsHeaders });
    }

    if (action === "update") {
      const updateData: Record<string, unknown> = {};
      if (password) updateData.password = password;
      
      const { data, error } = await adminClient.auth.admin.updateUserById(auth_id, updateData);
      if (error) throw error;
      return Response.json({ success: true, user: data.user }, { status: 200, headers: corsHeaders });
    }

    return Response.json({ error: "العملية غير مدعومة" }, { status: 400, headers: corsHeaders });

  } catch (error: unknown) {
    const err = error as Error;
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
});
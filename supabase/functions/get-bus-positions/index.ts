import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const API_BASE_URL = 'http://api.olhovivo.sptrans.com.br/v2.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Para desenvolvimento. Em produção, mude para o seu domínio.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const API_KEY = Deno.env.get('OLHO_VIVO_API_KEY')
    if (!API_KEY) {
      throw new Error('Chave da API Olho Vivo não configurada nos segredos.')
    }

    // --- CORREÇÃO: Lendo os dados do corpo (body) do pedido ---
    const { lineCode } = await req.json();
    if (!lineCode) {
      throw new Error('O parâmetro "lineCode" é obrigatório no corpo do pedido.')
    }

    // --- ETAPA DE AUTENTICAÇÃO NA API OLHO VIVO ---
    const authResponse = await fetch(`${API_BASE_URL}/Login/Autenticar?token=${API_KEY}`, {
      method: 'POST',
    })

    if (!authResponse.ok || !(await authResponse.text()).includes('true')) {
      throw new Error('Falha ao autenticar na API Olho Vivo.')
    }
    
    const authCookie = authResponse.headers.get('set-cookie')
    if (!authCookie) {
      throw new Error('Cookie de autenticação não recebido da API Olho Vivo.')
    }

    // --- ETAPA DE BUSCA DA POSIÇÃO DOS AUTOCARROS ---
    const positionsResponse = await fetch(`${API_BASE_URL}/Posicao/Linha?codigoLinha=${lineCode}`, {
      headers: { 'Cookie': authCookie },
    })

    if (!positionsResponse.ok) {
      throw new Error('Falha ao buscar a posição dos autocarros.')
    }

    const positionsData = await positionsResponse.json()

    return new Response(
      JSON.stringify(positionsData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

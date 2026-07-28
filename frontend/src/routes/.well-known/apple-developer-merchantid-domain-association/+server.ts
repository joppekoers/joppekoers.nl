import type { RequestHandler } from '@sveltejs/kit'
import content from '../../../assets/apple-developer-merchantid-domain-association.txt?raw'

// Apple Pay domain verification for Adyen, see
// https://docs.adyen.com/payment-methods/apple-pay/web-component/
export const GET: RequestHandler = () => {
	return new Response(content, {
		headers: { 'content-type': 'text/plain' },
	})
}

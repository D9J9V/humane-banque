Mini apps enable third-party developers to create native-like applications within World App. Building a mini app will provide access to our rapidly growing user network and monetization opportunities via WLD and USDC. In addition, mini apps introduce smart contract support natively inside of World App.  

# How it Works

Mini apps are simply web applications opened via webview inside of World App. Using the MiniKit SDK, these applications can become native-like and interact with the World ecosystem.
# Commands

Commands are defined actions your mini app can perform in World App. Every command is available as either:

- a synchronous function that dispatches an event, the result of which has to be listened for,
- an async function, that can be awaited, resolves with the result.

| Command              | Description                                               |
| -------------------- | --------------------------------------------------------- |
| Verify               | Verify an action with World ID.                           |
| Pay                  | Initiate a payment request.                               |
| Wallet Auth          | Authenticate via Sign in with Ethereum                    |
| Send Transaction     | Write to smart contracts                                  |
| Sign Message         | Sign personal messages with your wallet                   |
| Sign Typed Data      | Sign EIP-712 payloads with your wallet                    |
| Share Contacts       | Share your contacts in a privacy preserving way with apps |
| Notifications        | Send notifications to users                               |
| Quick Actions        | Use other mini app feature                                |
| Get Permissions      | Get user permissions                                      |
| Send Haptic Feedback | Send haptic feedback to user's device                     |
# Responses

World App will return responses to your mini app based on the command sent. You can define custom logic to handle these responses with MiniKit. If you choose to use event listeners, we recommend adding them only to the pages where they are triggered.

Another way of handling responses is to use async handlers. Calling an async handler will call the command and wait for a response from WorldApp The resolved object contains the WorldApp response (`finalPayload`) along with an object returned by calling command (`commandPayload`). You don't have to worry about cleaning up the listeners, and the command can be simply awaited.

### [Example Response](https://docs.world.org/mini-apps/quick-start/responses#example-response)

Two ways of getting the response:

Event listeners
```tsx
import { MiniKit, ResponseEvent } from '@worldcoin/minikit-js'

export function ReactComponent() {
	// ...
	useEffect(() => {
		MiniKit.subscribe(ResponseEvent.MiniAppVerifyAction, async payload => {
			if (payload.status === 'error') {
				return console.log('Error payload', payload)
			}

			// Verify the proof in the backend
			const verifyResponse = await fetch('/api/verify', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: {
					//...
				},
			})
		})

		return () => {
			// Clean up on unmount
			MiniKit.unsubscribe(ResponseEvent.MiniAppVerifyAction)
		}
	}, [])
}
```

Async handlers
```tsx
import { MiniKit } from '@worldcoin/minikit-js'
// ...

const handleVerify = async () => {
	// ...

	// The async versions of commands, return an object that contains the final payload, which is the response from World App,
	// as well as commandPayload, which is the object that is returned after calling the command.
	const { finalPayload } = await MiniKit.verifyAsync({
		//...
	})

	if (finalPayload.status === 'error') {
		return console.log('Error payload', finalPayload)
	}

	// Verify the proof in the backend
	const verifyResponse = await fetch('/api/verify', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: {
			// ...
		},
	})
}
```

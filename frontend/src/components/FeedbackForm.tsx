import {useState} from 'react'
import { submitFeedback } from '../lib/api'


export function FeedbackForm() {
  const [message, setMessage] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [submitted, setSubmitted] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

    async function handleSubmit(){
        if(message.length == 0) return
        setLoading(true)
        try {
            await submitFeedback(message, email)
            setSubmitted(true)
        } catch(e) {
            setError(e instanceof Error ? e.message : "Something went wrong.")
        } finally {
            setLoading(false)
        }

    }

  return (
    <div className = "border rounded-xl p-4 text-sm max-w-lg mx-auto px-4 flex flex-col gap-3 mb-12">
        <h2 className="text-center">Give Feedback!</h2>
        <textarea className = "bg-bg text-text border border-border rounded-xl px-4 py-3" placeholder="Your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value) }
        />
        <input className="bg-bg text-text border border-border rounded-xl px-4 py-3" placeholder="Email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        />
        <div className="flex justify-center">
        <button className='bg-teal text-bg px-6 py-2 rounded-xl font-bold text-sm w-fit' onClick={handleSubmit}>Submit</button>
        {error && <p>{error}</p>}
        {submitted && <p>Thank you for your feedback!</p>}
        </div>
    </div>
  )

}
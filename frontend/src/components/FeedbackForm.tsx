import {useState} from 'react'
import { submitFeedback } from '../lib/api'


export function FeedbackForm( ) {
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
    <div>
        <h2>Feedback</h2>
        <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value) }
        />
        <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={handleSubmit}>Submit</button>
        {error && <p>{error}</p>}
        {submitted && <p>Thank you for your feedback!</p>}
    </div>
  )

}
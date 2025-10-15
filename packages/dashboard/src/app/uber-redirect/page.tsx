'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UberRedirectPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Uber OAuth...');
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const authCode = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      setStatus('error');
      setMessage(`OAuth Error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
      return;
    }

    if (authCode) {
      setCode(authCode);
      setStatus('success');
      setMessage('Successfully authorized with Uber!');

      // Store the auth code for the MCP to use
      if (typeof window !== 'undefined') {
        localStorage.setItem('uber_auth_code', authCode);

        // Notify parent window if in popup
        if (window.opener) {
          window.opener.postMessage({ type: 'uber_auth_success', code: authCode }, '*');
        }
      }
    } else {
      setStatus('error');
      setMessage('No authorization code received from Uber');
    }
  }, [searchParams]);

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setMessage('Code copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-md w-full p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold mb-2">Processing...</h1>
              <p className="text-muted-foreground">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2 text-green-600 dark:text-green-400">Success!</h1>
              <p className="text-muted-foreground mb-6">{message}</p>

              {code && (
                <div className="bg-muted p-4 rounded-md mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Authorization Code:</p>
                  <p className="font-mono text-xs break-all">{code}</p>
                </div>
              )}

              <div className="space-y-3">
                {code && (
                  <Button onClick={handleCopyCode} variant="outline" className="w-full">
                    Copy Code
                  </Button>
                )}
                <Button onClick={() => window.close()} className="w-full">
                  Close Window
                </Button>
                <Button onClick={() => window.location.href = '/chat'} variant="ghost" className="w-full">
                  Go to Chat
                </Button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="rounded-full bg-red-100 dark:bg-red-900 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">Error</h1>
              <p className="text-muted-foreground mb-6">{message}</p>

              <div className="space-y-3">
                <Button onClick={() => window.location.href = '/chat'} className="w-full">
                  Go to Chat
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                  Try Again
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

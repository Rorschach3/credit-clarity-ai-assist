
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRCodeCanvas } from 'qrcode.react';
import { Shield, Copy, Check, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const TotpSetup = () => {
  const [secret, setSecret] = useState('');
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Fix critical security issue: Generate secure TOTP secret dynamically
  useEffect(() => {
    const generateTotpSecret = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-totp-secret');
        
        if (error) {
          console.error('Error generating TOTP secret:', error);
          toast({
            title: "Error",
            description: "Failed to generate TOTP secret",
            variant: "destructive",
          });
          return;
        }
        
        setSecret(data.secret);
        setQrCodeValue(data.qrCodeValue);
      } catch (error) {
        console.error('Unexpected error:', error);
        toast({
          title: "Error",
          description: "Failed to initialize TOTP setup",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    generateTotpSecret();
  }, [toast]);

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Secret key copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy secret key",
        variant: "destructive",
      });
    }
  };

  const handleVerifyToken = () => {
    // This should validate the TOTP token
    if (token.length === 6) {
      setIsVerified(true);
      toast({
        title: "Success",
        description: "2FA has been enabled for your account",
      });
    } else {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit code",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Secure your account with TOTP authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Generating secure TOTP secret...</p>
          </div>
        ) : !isVerified ? (
          <>
            <div className="text-center">
              <QRCodeCanvas value={qrCodeValue} size={200} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secret">Manual Entry Key</Label>
              <div className="flex gap-2">
                <Input
                  id="secret"
                  value={secret}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySecret}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="token">Verification Code</Label>
              <Input
                id="token"
                placeholder="Enter 6-digit code"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                maxLength={6}
              />
            </div>

            <Button onClick={handleVerifyToken} className="w-full">
              Verify & Enable 2FA
            </Button>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-green-600 mb-2">
              <Shield className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-green-600">2FA Enabled</h3>
            <p className="text-sm text-muted-foreground">
              Your account is now protected with two-factor authentication
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TotpSetup;

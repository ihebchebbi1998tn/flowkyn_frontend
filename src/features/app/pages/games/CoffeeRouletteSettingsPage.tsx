/**
 * Coffee Roulette Settings Admin Page
 * 
 * Allows event organizers to manage all aspects of Coffee Roulette:
 * - Configure game settings (duration, strategies, etc.)
 * - Manage topics and questions
 * - Map questions to topics
 * - View analytics and usage
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader, AlertCircle, ArrowLeft, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CoffeeRouletteSettings,
  TopicsManager,
  QuestionsManager,
  TopicQuestionsMapper,
} from '@/features/app/components/coffee-roulette';
import { coffeeRouletteConfigApi } from '@/features/app/api/coffeeRouletteConfig';
import type { CoffeeRouletteConfig } from '@/types';

export function CoffeeRouletteSettingsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [config, setConfig] = useState<CoffeeRouletteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!eventId) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Event ID is required</AlertDescription>
        </Alert>
      </div>
    );
  }

  useEffect(() => {
    loadConfig();
  }, [eventId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await coffeeRouletteConfigApi.getConfig(eventId);
      setConfig(response || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Coffee className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Coffee Roulette Configuration</h1>
            <p className="text-gray-500">Manage topics, questions, and game settings for this event</p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-lg">Configuration Status</CardTitle>
        </CardHeader>
        <CardContent>
          {config ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-green-500 rounded-full" />
                <p className="font-medium">Configuration Active</p>
              </div>
              <p className="text-sm text-gray-600">
                Created {new Date(config.created_at).toLocaleDateString()} • Last updated{' '}
                {new Date(config.updated_at).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-orange-500 rounded-full" />
                <p className="font-medium">No Configuration Yet</p>
              </div>
              <p className="text-sm text-gray-600">
                Create a configuration to get started with Coffee Roulette for this event
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="topics" disabled={!config}>
            Topics
          </TabsTrigger>
          <TabsTrigger value="questions" disabled={!config}>
            Questions
          </TabsTrigger>
          <TabsTrigger value="mapping" disabled={!config}>
            Mapping
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Game Settings</CardTitle>
              <CardDescription>
                Configure how Coffee Roulette will work for your event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CoffeeRouletteSettings eventId={eventId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics">
          <Card>
            <CardHeader>
              <CardTitle>Discussion Topics</CardTitle>
              <CardDescription>
                Create and manage conversation topics for Coffee Roulette pairs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {config ? (
                <TopicsManager eventId={eventId} configId={config.id} />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Create a configuration first to add topics
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Conversation Questions</CardTitle>
              <CardDescription>
                Create questions and prompts for Coffee Roulette conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {config ? (
                <QuestionsManager eventId={eventId} configId={config.id} />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Create a configuration first to add questions
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mapping Tab */}
        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle>Topic-Question Mapping</CardTitle>
              <CardDescription>
                Assign questions to topics and organize them for your conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {config ? (
                <TopicQuestionsMapper eventId={eventId} configId={config.id} />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Create a configuration first to map questions to topics
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">How Coffee Roulette Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium">1. Configure Settings</h4>
            <p className="text-gray-600">
              Set the duration, number of topics, and selection strategies
            </p>
          </div>
          <div>
            <h4 className="font-medium">2. Create Topics</h4>
            <p className="text-gray-600">
              Add conversation topics that pairs will discuss
            </p>
          </div>
          <div>
            <h4 className="font-medium">3. Create Questions</h4>
            <p className="text-gray-600">
              Add discussion prompts and questions for conversations
            </p>
          </div>
          <div>
            <h4 className="font-medium">4. Map Questions to Topics</h4>
            <p className="text-gray-600">
              Organize which questions go with which topics
            </p>
          </div>
          <div>
            <h4 className="font-medium">5. Run the Game</h4>
            <p className="text-gray-600">
              Participants pair up and have conversations using your topics and questions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Users, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/features/app/context/AuthContext';
import { eventsApi } from '@/features/app/api/events';
import { organizationsApi } from '@/features/app/api/organizations';
import { ROUTES } from '@/constants/routes';
import logoImg from '@/assets/flowkyn-logo.png';
import { LogoLoader } from '@/components/loading/LogoLoader';

type InviteType = 'org' | 'event';
type InviteStatus = 'loading' | 'valid' | 'accepted' | 'expired' | 'error';

interface InviteInfo {
  type: InviteType;
  title: string;
  description: string;
  orgName?: string;
  eventMode?: string;
  status: string;
}

export default function AcceptInvitation() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [status, setStatus] = useState<InviteStatus>('loading');
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const inviteType = (searchParams.get('type') as InviteType) || 'org';

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const currentSearch = new URLSearchParams(searchParams);
      if (!currentSearch.has('type')) currentSearch.set('type', inviteType);
      const returnUrl = `/invite/${token}?${currentSearch.toString()}`;
      navigate(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(returnUrl)}`);
    }
  }, [authLoading, isAuthenticated, token, inviteType, navigate, searchParams]);

  useEffect(() => {
    if (!token || !isAuthenticated) return;

    async function validateInvitation() {
      setStatus('loading');
      try {
        if (inviteType === 'event') {
          const eventId = searchParams.get('eventId');
          if (!eventId) {
            setStatus('error');
            setErrorMessage(t('invitation.missingEventInfo'));
            return;
          }
          const data = await eventsApi.validateToken(eventId, token!);
          setInviteInfo({
            type: 'event',
            title: data.event_title,
            description: data.event_description || '',
            orgName: data.organization_name,
            eventMode: data.event_mode,
            status: data.status,
          });
          setStatus('valid');
        } else {
          setInviteInfo({
            type: 'org',
            title: t('invitation.orgInviteTitle'),
            description: t('invitation.orgInviteDescription'),
            status: 'pending',
          });
          setStatus('valid');
        }
      } catch (err: any) {
        const code = err?.code || '';
        if (code === 'INVITATION_EXPIRED' || code === 'INVITATION_USED') {
          setStatus('expired');
          setErrorMessage(t('invitation.expiredMessage'));
        } else {
          setStatus('error');
          setErrorMessage(err?.message || t('invitation.somethingWrong'));
        }
      }
    }

    validateInvitation();
  }, [token, isAuthenticated, inviteType, searchParams, t]);

  const handleAccept = async () => {
    if (!token) return;
    setStatus('loading');
    try {
      if (inviteType === 'event') {
        const eventId = searchParams.get('eventId');
        if (!eventId) throw new Error('Missing event ID');
        await eventsApi.acceptInvitation(eventId, token);
        setStatus('accepted');
        setTimeout(() => navigate(ROUTES.EVENT_LOBBY(eventId)), 2000);
      } else {
        await organizationsApi.acceptInvitation(token);
        setStatus('accepted');
        setTimeout(() => navigate(ROUTES.DASHBOARD), 2000);
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || t('invitation.somethingWrong'));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LogoLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <img src={logoImg} alt="Flowkyn" className="h-16 w-16 object-contain" />
        </div>

        <Card className="border-border/50 shadow-xl shadow-primary/5 rounded-2xl overflow-hidden">
          <CardContent className="p-8">
            {status === 'loading' && (
              <div className="flex flex-col items-center py-8">
                <LogoLoader size="md" className="mb-4" />
                <p className="text-[15px] font-medium text-foreground">{t('invitation.verifying')}</p>
                <p className="text-[13px] text-muted-foreground mt-1">{t('invitation.pleaseWait')}</p>
              </div>
            )}

            {status === 'valid' && inviteInfo && (
              <div className="flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                  {inviteInfo.type === 'event' ? <Calendar className="h-7 w-7 text-primary" /> : <Users className="h-7 w-7 text-primary" />}
                </div>
                <h2 className="text-[20px] font-bold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {inviteInfo.type === 'event' ? t('invitation.eventInvitation') : t('invitation.teamInvitation')}
                </h2>
                <p className="text-[14px] text-muted-foreground leading-relaxed mb-2">{t('invitation.invitedToJoin')}</p>
                <div className="rounded-xl bg-muted/40 border border-border/50 px-5 py-4 w-full mb-6">
                  <p className="text-[16px] font-bold text-foreground">{inviteInfo.title}</p>
                  {inviteInfo.orgName && <p className="text-[12px] text-muted-foreground mt-1">{t('invitation.by')} {inviteInfo.orgName}</p>}
                  {inviteInfo.description && <p className="text-[13px] text-muted-foreground mt-2 line-clamp-2">{inviteInfo.description}</p>}
                </div>
                <Button onClick={handleAccept} className="w-full h-12 text-[15px] font-bold rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                  {t('invitation.accept')} <ArrowRight className="h-4 w-4" />
                </Button>
                <Link to={ROUTES.HOME} className="text-[12px] text-muted-foreground hover:text-foreground mt-4 transition-colors">
                  {t('invitation.declineGoHome')}
                </Link>
              </div>
            )}

            {status === 'accepted' && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                  className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-5">
                  <CheckCircle className="h-8 w-8 text-success" />
                </motion.div>
                <h2 className="text-[20px] font-bold text-foreground mb-2">{t('invitation.youreIn')}</h2>
                <p className="text-[14px] text-muted-foreground">{t('invitation.redirecting')}</p>
              </motion.div>
            )}

            {status === 'expired' && (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-warning/10 flex items-center justify-center mb-5">
                  <XCircle className="h-7 w-7 text-warning" />
                </div>
                <h2 className="text-[18px] font-bold text-foreground mb-2">{t('invitation.expired')}</h2>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">{errorMessage}</p>
                <Link to={ROUTES.HOME}><Button variant="outline" className="rounded-xl">{t('invitation.goToHomepage')}</Button></Link>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-5">
                  <XCircle className="h-7 w-7 text-destructive" />
                </div>
                <h2 className="text-[18px] font-bold text-foreground mb-2">{t('invitation.somethingWrong')}</h2>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">{errorMessage}</p>
                <Link to={ROUTES.HOME}><Button variant="outline" className="rounded-xl">{t('invitation.goToHomepage')}</Button></Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

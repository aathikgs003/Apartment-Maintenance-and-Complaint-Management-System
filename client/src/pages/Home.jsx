import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  HomeIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon,
  BellAlertIcon,
  ChartBarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const features = [
    {
      icon: ClipboardDocumentListIcon,
      title: t('easy_complaint_registration'),
      description: t('easy_complaint_desc'),
      color: 'bg-blue-500',
    },
    {
      icon: ClockIcon,
      title: t('real_time_tracking'),
      description: t('tracking_desc'),
      color: 'bg-purple-500',
    },
    {
      icon: BellAlertIcon,
      title: t('instant_notifications'),
      description: t('notifications_desc'),
      color: 'bg-green-500',
    },
    {
      icon: UserGroupIcon,
      title: t('dedicated_staff'),
      description: t('staff_desc'),
      color: 'bg-orange-500',
    },
    {
      icon: ChartBarIcon,
      title: t('analytics_dashboard'),
      description: t('analytics_desc'),
      color: 'bg-red-500',
    },
    {
      icon: ShieldCheckIcon,
      title: t('secure_reliable'),
      description: t('secure_desc'),
      color: 'bg-indigo-500',
    },
  ];

  const steps = [
    {
      number: '01',
      title: t('step_register'),
      description: t('step_register_desc'),
    },
    {
      number: '02',
      title: t('step_raise'),
      description: t('step_raise_desc'),
    },
    {
      number: '03',
      title: t('step_track'),
      description: t('step_track_desc'),
    },
    {
      number: '04',
      title: t('step_rate'),
      description: t('step_rate_desc'),
    },
  ];

  const testimonials = [
    {
      name: 'Rahul Sharma',
      flat: 'A-101',
      rating: 5,
      text: 'Amazing service! My plumbing issue was fixed within 24 hours. Very professional staff.',
    },
    {
      name: 'Priya Patel',
      flat: 'B-205',
      rating: 5,
      text: 'The tracking system is excellent. I always know the status of my complaints.',
    },
    {
      name: 'Amit Kumar',
      flat: 'C-302',
      rating: 4,
      text: 'Quick response time and efficient service. Highly recommend this system.',
    },
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-sky-100 selection:text-sky-900">
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[90vh] flex items-center pt-20 pb-32 overflow-hidden bg-gradient-to-br from-sky-50 via-white to-sky-50">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-300/30 rounded-full mix-blend-multiply filter blur-[120px] animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-300/30 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000"></div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100 border border-sky-200 text-sky-700 text-sm font-bold mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </span>

                {t('next_gen_platform')}
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-8">
                {t('smart_maintenance')} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">{t('simplified')}</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t('empowering_text')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {user ? (
                  <Link to={`/${user.role}/dashboard`} className="btn-primary py-4 px-10 text-lg group bg-sky-600 hover:bg-sky-700 border-transparent text-white shadow-lg shadow-sky-200">
                    {t('enter_workspace')} <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="btn-primary py-4 px-10 text-lg group bg-sky-600 hover:bg-sky-700 border-transparent text-white shadow-lg shadow-sky-200">
                      {t('get_started_free')} <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link to="/login" className="btn-secondary py-4 px-10 text-lg bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300">
                      {t('sign_in')}
                    </Link>
                  </>
                )}
              </div>

              {/* Real-time Stats */}
              <div className="mt-16 grid grid-cols-3 gap-4 border-t border-slate-200 pt-10">
                <div><p className="text-3xl font-black text-slate-900">500+</p><p className="text-slate-500 text-xs uppercase tracking-widest font-bold mt-1">{t('resolved')}</p></div>
                <div><p className="text-3xl font-black text-slate-900">50+</p><p className="text-slate-500 text-xs uppercase tracking-widest font-bold mt-1">{t('residents')}</p></div>
                <div><p className="text-3xl font-black text-slate-900">4.8</p><p className="text-slate-500 text-xs uppercase tracking-widest font-bold mt-1">{t('avg_rating')}</p></div>
              </div>
            </div>

            {/* Right Content - Modern Glass Mockups */}
            <div className="hidden lg:block animate-slide-up">
              <div className="relative p-8">
                {/* Decorative glow */}
                <div className="absolute inset-0 bg-sky-200/50 blur-[100px] rounded-full"></div>

                <div className="relative space-y-6">
                  {/* Floating Card 1 */}
                  <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/50 shadow-xl translate-x-10 hover:-translate-y-2 transition-transform duration-500">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">{t('completed')}</div>
                      <span className="text-slate-400 text-[10px] font-mono">CMPL-2024-001</span>
                    </div>
                    <p className="text-slate-900 font-bold text-lg mb-2">{t('plumbing_repair')}</p>
                    <p className="text-slate-500 text-sm">{t('issue_resolved_time')}</p>
                    <div className="mt-4 flex items-center gap-2 text-emerald-600 text-xs font-bold">
                      <CheckCircleIcon className="h-4 w-4" /> {t('verified_by_admin')}
                    </div>
                  </div>

                  {/* Floating Card 2 */}
                  <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/50 shadow-xl hover:-translate-y-2 transition-transform duration-500 delay-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-sky-100 text-sky-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">{t('in_process').toUpperCase()}</div>
                      <span className="text-slate-400 text-[10px] font-mono">CMPL-2024-002</span>
                    </div>
                    <p className="text-slate-900 font-bold text-lg mb-4">{t('electrical_short')}</p>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full w-[65%] animate-pulse"></div>
                    </div>
                    <p className="mt-3 text-slate-500 text-[10px] uppercase font-black tracking-widest">{t('technician_on_way')}</p>
                  </div>

                  {/* Alert Tag */}
                  <div className="absolute -bottom-10 right-0 bg-white py-3 px-6 rounded-2xl border border-slate-100 flex items-center gap-3 animate-bounce shadow-xl">
                    <div className="bg-sky-500 p-2 rounded-lg shadow-lg shadow-sky-500/30">
                      <BellAlertIcon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-slate-700 font-bold text-sm">{t('new_update_staff')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-xs uppercase tracking-[0.3em] font-black text-sky-600 mb-4">{t('the_platform')}</h2>
            <p className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">{t('everything_you_need')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-slate-50 rounded-3xl p-8 group hover:bg-sky-50 hover:shadow-xl hover:shadow-sky-100 transition-all duration-300">
                <div className={`${feature.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-current/20 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed group-hover:text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (Glass Stepper) --- */}
      <section className="py-32 bg-sky-50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-200/40 rounded-full blur-[120px]"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">{t('four_simple_steps')}</h2>
            <p className="text-slate-600">{t('streamlining_maint')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center group">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-white text-3xl font-black text-sky-600 mb-8 shadow-lg shadow-sky-100 group-hover:bg-sky-600 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed px-4">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-px border-t border-dashed border-sky-200 -z-10"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS (Glass Cards) --- */}
      <section className="py-32 bg-white/50 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-100/40 rounded-full blur-[120px] -z-10"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">{t('loved_by_residents')}</h2>
            </div>
            <p className="text-slate-500 font-medium">{t('join_users')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, index) => (
              <div key={index} className="bg-white p-10 rounded-3xl border border-sky-100 shadow-xl shadow-sky-100/50 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                <div className="flex gap-1 mb-8">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-lg leading-relaxed mb-10 font-medium italic">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sky-500/30">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-slate-900">{t.name}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Flat {t.flat}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto rounded-[3rem] bg-gradient-to-br from-sky-400 to-blue-600 p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-sky-500/30">
          {/* Background design */}
          <div className="absolute top-0 right-0 w-96 h-96 border-[40px] border-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">{t('ready_for_better')}</h2>
            <p className="text-sky-50 text-lg mb-12 opacity-90">{t('hassle_free_exp')}</p>
            {!user && (
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link to="/register" className="btn-primary py-5 px-12 text-xl bg-white text-blue-600 hover:bg-sky-50 shadow-xl shadow-black/5 border-transparent">{t('create_account')}</Link>
                <Link to="/login" className="btn-secondary py-5 px-12 text-xl bg-blue-700/30 text-white border-white/20 hover:bg-blue-700/50 backdrop-blur-sm">{t('sign_in')}</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white pt-24 pb-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 border-b border-slate-100 pb-16">
            <div className="flex items-center gap-4">
              <div className="bg-sky-500 p-3 rounded-2xl shadow-xl shadow-sky-500/20">
                <HomeIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">{t('app_name')}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{t('maintenance_redefined')}</p>
              </div>
            </div>
            <div className="flex gap-10">
              {['About', 'Contact', 'Privacy', 'Terms'].map((link) => (
                <Link key={link} to={`/${link.toLowerCase()}`} className="text-sm font-bold text-slate-500 hover:text-sky-600 transition-colors">{t(link.toLowerCase())}</Link>
              ))}
            </div>
          </div>
          <div className="mt-12 text-center text-slate-400 text-sm font-medium">
            <p>{t('copyright_text', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
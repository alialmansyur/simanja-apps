import React from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import Button, { cn } from '../components/ui/Button';
import { adminNavigationGroups } from '../constants/navigation';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

const navItemMotion = {
  rest: { scale: 1, x: 0 },
  hover: { scale: 1.02, x: 2 },
  tap: { scale: 0.98 },
};

const Sidebar = ({
  isOpen,
  setIsOpen,
  isCollapsed,
  userProfile,
  onLogout,
}) => {
  const { settings } = useSettings();
  const { hasPermission, hasRole } = useAuth();
  const appName = settings['app.name'] || 'Simanja';
  const shortName = settings['app.short_name'] || 'SM';

  const isSuperAdmin = hasRole('Super Admin') || hasRole('super-admin');

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-[3px] lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        layout
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white/98 transition-[width,transform] duration-300 ease-out dark:border-slate-800 dark:bg-slate-900/98 lg:static lg:z-0 lg:translate-x-0',
          isCollapsed ? 'w-[5.5rem]' : 'w-[16.5rem]',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="relative flex h-[4.5rem] items-center border-b border-slate-200 px-4 dark:border-slate-800">
          <div className={cn('flex w-full items-center', isCollapsed ? 'justify-center' : 'gap-3 min-w-0')}>
            {settings['app.logo'] ? (
               <motion.img
                 whileHover={{ scale: 1.04 }}
                 src={`http://localhost:8000/storage/${settings['app.logo']}`}
                 alt="Logo"
                 className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[1.25em] object-contain bg-white"
               />
            ) : (
              <motion.div
                whileHover={{ scale: 1.04 }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[1.25em] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 text-xs font-bold text-white uppercase"
              >
                {shortName.substring(0, 2)}
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="min-w-0"
                >
                  <p className="truncate text-lg font-bold text-slate-900 dark:text-white">
                    {shortName}
                  </p>
                  <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">
                    Admin Panel
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4 scrollbar-hide">
            <div className="space-y-5">
              {adminNavigationGroups.map((group, groupIndex) => {
                const allowedItems = group.items.filter(
                  item => !item.permission || isSuperAdmin || hasPermission(item.permission)
                );

                if (allowedItems.length === 0) return null;

                return (
                <div key={group.label} className="space-y-1">
                  {!isCollapsed && (
                    <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                      {group.label}
                    </p>
                  )}

                  {allowedItems.map((item, itemIndex) => {
                    const Icon = item.icon;
                    const delayIndex = groupIndex * 0.06 + itemIndex * 0.04;

                    return (
                      <motion.div
                        key={item.path}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: delayIndex }}
                        variants={navItemMotion}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <NavLink
                          to={item.path}
                          end={item.path === '/admin'}
                          onClick={() => setIsOpen(false)}
                          title={isCollapsed ? item.label : undefined}
                          className={({ isActive }) =>
                            cn(
                              'group flex items-center text-base font-semibold transition-all duration-200',
                              isCollapsed ? 'justify-center px-2.5 py-2.5' : 'gap-2.5 rounded-xl px-3 py-2',
                              isActive && (isCollapsed ? 'p-3' : 'px-4 py-3'),
                              isActive
                                ? (isCollapsed ? 'text-blue-600 dark:text-blue-400' : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white')
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50'
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <span
                                className={cn(
                                  'flex shrink-0 items-center justify-center transition-colors duration-200',
                                  isActive
                                    ? (isCollapsed
                                      ? 'text-blue-600 dark:text-blue-400'
                                      : 'text-white')
                                    : (isCollapsed
                                      ? 'text-slate-500 dark:text-slate-300'
                                      : 'text-slate-500 dark:text-slate-300')
                                )}
                              >
                                <Icon size={17} />
                              </span>

                              {!isCollapsed && (
                                <span className="flex flex-1 items-center justify-between gap-3">
                                  <span className="font-semibold">{item.label}</span>
                                  <span className="flex items-center gap-2">
                                    {item.badge && (
                                      <span
                                        className={cn(
                                          'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                          isActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300'
                                        )}
                                      >
                                        {item.badge}
                                      </span>
                                    )}
                                    {isActive && <span className="h-2 w-2 rounded-full bg-white/70" />}
                                  </span>
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      </motion.div>
                    );
                  })}
                </div>
                );
              })}
            </div>
          </nav>

          <motion.div
            layout
            className="mt-auto border-t border-slate-200 bg-white/95 p-3 dark:border-slate-800 dark:bg-slate-900/95"
          >
            <div className={isCollapsed ? 'p-2' : 'p-3'}>
              <div className={cn('flex items-center', isCollapsed ? 'justify-center' : 'gap-3')}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1.25em] bg-gradient-to-br from-blue-600 to-blue-500 text-xs font-bold text-white"
                >
                  {userProfile.initials}
                </motion.div>

                {!isCollapsed && (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {userProfile.name}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {userProfile.role}
                      </p>
                    </div>

                    <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer h-10 w-10 shrink-0 rounded-[1.25em] border border-transparent bg-transparent text-red-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:border-red-900/50 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                        onClick={onLogout}
                        title="Keluar"
                        aria-label="Keluar"
                      >
                        <LogOut size={16} />
                      </Button>
                    </motion.div>
                  </>
                )}
              </div>

              {isCollapsed && (
                <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }} className="mt-2 flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer h-10 w-10 min-w-10 rounded-full border border-transparent bg-transparent text-red-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:border-red-900/50 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                    onClick={onLogout}
                    title="Keluar"
                    aria-label="Keluar"
                  >
                    <LogOut size={16} />
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;

import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  ClockIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

const ComplaintCard = ({ complaint }) => {
  // Status badge configuration
  const getStatusConfig = (status) => {
    const configs = {
      Pending: {
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: ClockIcon,
      },
      Assigned: {
        color: 'bg-sky-100 text-sky-700 border-sky-200',
        icon: UserIcon,
      },
      'In Progress': {
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        icon: ArrowPathIcon,
      },
      Completed: {
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: CheckCircleIcon,
      },
      'Payment Pending': {
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: ClockIcon,
      },
      'Payment Received': {
        color: 'bg-teal-100 text-teal-700 border-teal-200',
        icon: CheckCircleIcon,
      },
      'Payment Completed': {
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: CheckCircleIcon,
      },
      Closed: {
        color: 'bg-slate-100 text-slate-600 border-slate-200',
        icon: CheckCircleIcon,
      },
    };
    return configs[status] || configs.Pending;
  };

  // Priority badge configuration
  const getPriorityConfig = (priority) => {
    const configs = {
      High: 'bg-rose-50 text-rose-600 border border-rose-100',
      Medium: 'bg-amber-50 text-amber-600 border border-amber-100',
      Low: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    };
    return configs[priority] || configs.Medium;
  };

  const statusConfig = getStatusConfig(complaint.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Link
      to={`/resident/complaints/${complaint._id}`}
      className="block group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 border border-slate-100 overflow-hidden"
    >
      {/* Header with ID and Status */}
      <div className="bg-gradient-to-r from-slate-50 to-white px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${complaint.isDelayed ? 'bg-rose-100 text-rose-600' : 'bg-white text-slate-400 border border-slate-100 shadow-sm'}`}>
              {complaint.isDelayed ? (
                <ExclamationTriangleIcon className="h-5 w-5" />
              ) : (
                <StatusIcon className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-slate-400">#{complaint.complaintId}</p>
              {complaint.isDelayed && (
                <p className="text-xs font-bold text-rose-600">Action Required</p>
              )}
            </div>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.color}`}
          >
            {complaint.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category and Priority */}
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 uppercase tracking-wide">
            {complaint.category}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${getPriorityConfig(
              complaint.priority
            )}`}
          >
            {complaint.priority}
          </span>
        </div>

        {/* Description */}
        <h3 className="text-slate-800 font-bold mb-2 line-clamp-1 group-hover:text-sky-600 transition-colors">
          {complaint.title || complaint.description.substring(0, 50)}
        </h3>
        <p className="text-slate-500 text-sm mb-5 line-clamp-2 leading-relaxed">
          {complaint.description}
        </p>

        {/* Images Preview */}
        {complaint.images && complaint.images.length > 0 && (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide">
            {complaint.images.slice(0, 3).map((image, index) => (
              <div key={index} className="relative h-14 w-14 rounded-xl overflow-hidden shadow-sm border border-slate-100 flex-shrink-0">
                <img
                  src={image}
                  alt={`Complaint ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
            {complaint.images.length > 3 && (
              <div className="h-14 w-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-slate-500 font-bold">
                  +{complaint.images.length - 3}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex items-center gap-4">
            {complaint.assignedTo ? (
              <div className="flex items-center gap-2">
                {complaint.assignedTo.profileImage ? (
                  <img src={complaint.assignedTo.profileImage} className="w-6 h-6 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                    {complaint.assignedTo.name?.charAt(0)}
                  </div>
                )}
                <span className="text-xs font-bold text-slate-600 truncate max-w-[80px]">{complaint.assignedTo.name.split(' ')[0]}</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">Unassigned</span>
            )}
          </div>

          <div className="flex items-center text-xs font-medium text-slate-400 gap-1">
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>{formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ComplaintCard;
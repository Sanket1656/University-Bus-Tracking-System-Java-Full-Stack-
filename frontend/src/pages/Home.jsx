import React, { useState, useEffect } from 'react';
import {
  Bus, MapPin, Clock, Calendar, User, Phone, Bell, Search, Menu, X,
  ChevronDown, Navigation, Share2, AlertCircle, CheckCircle, Route,
  Activity, MessageSquare, Settings, LogOut, Zap, Shield, FileText,
  ExternalLink, ChevronRight, Radio
} from 'lucide-react';
import studentApi from '../api/studentApi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StudentHome = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

  const [user, setUser] = useState(null);

  const fetchStudentProfile  = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found ❌");
        return;
      }
      const response = await studentApi.getProfile();
      setUser(response.data.data);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchStudentProfile ();
  }, []);


  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };


  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications] = useState(3);

  const studentData = {
    name: user?.name || 'John Doe',
    studentId: user?.enrollmentNumber || '12345678',
    department: user?.branch || 'Computer Science',
    email: user?.email || 'john.doe@university.edu',
    phone: user?.phone || '+91 98765 43210',
  };

  const busData = {
    busNumber: 'BUS-42',
    driverName: 'Rajesh Kumar',
    driverPhone: '+91 98765 12345',
    currentSpeed: '45 km/h',
    capacity: 50,
    availableSeats: 12,
    routeName: 'Route A - North Campus',
    currentLocation: 'MG Road Junction',
    estimatedArrival: '8 mins',
    lastUpdated: '2 mins ago'
  };

  const journeySteps = [
    { id: 1, name: 'Home Pickup', time: '7:30 AM', status: 'completed', location: 'Sector 21, Pune' },
    { id: 2, name: 'Current Stop', time: '7:45 AM', status: 'current', location: 'MG Road Junction' },
    { id: 3, name: 'Upcoming Stop', time: '8:00 AM', status: 'upcoming', location: 'City Center Mall' },
    { id: 4, name: 'University Arrival', time: '8:15 AM', status: 'upcoming', location: 'Main Gate' }
  ];

  const recentNotifications = [
    { id: 1, title: 'Bus Departed', message: 'Your bus has departed from Stop A', time: '5 mins ago', read: false, type: 'info' },
    { id: 2, title: 'Route Updated', message: 'Route A has been modified due to traffic', time: '1 hour ago', read: false, type: 'warning' },
    { id: 3, title: 'Driver Changed', message: 'New driver assigned: Rajesh Kumar', time: '2 hours ago', read: true, type: 'info' },
    { id: 4, title: 'Holiday Notice', message: 'University closed on 15th June', time: '1 day ago', read: true, type: 'success' }
  ];

  const upcomingSchedule = [
    { date: 'Today', time: '7:30 AM', route: 'Route A', status: 'Active' },
    { date: 'Tomorrow', time: '7:30 AM', route: 'Route A', status: 'Scheduled' },
    { date: '11 June', time: '7:30 AM', route: 'Route A', status: 'Scheduled' },
    { date: '12 June', time: '7:30 AM', route: 'Route A', status: 'Scheduled' }
  ];

  const announcements = [
    { id: 1, title: 'Summer Break Schedule', date: '8 June 2026', category: 'Academic', excerpt: 'University will be closed from 20th June to 5th July...' },
    { id: 2, title: 'New Bus Routes Added', date: '7 June 2026', category: 'Transport', excerpt: 'Two new routes have been added for South Campus students...' },
    { id: 3, title: 'Safety Guidelines', date: '5 June 2026', category: 'Safety', excerpt: 'Please follow COVID-19 safety protocols while traveling...' }
  ];

  const quickActions = [
    { icon: Bus, label: 'Track Bus', color: 'from-blue-500 to-cyan-500' },
    { icon: Route, label: 'View Route', color: 'from-purple-500 to-pink-500' },
    { icon: User, label: 'My Profile', color: 'from-green-500 to-emerald-500' },
    { icon: Calendar, label: 'Attendance', color: 'from-orange-500 to-red-500' },
    { icon: Clock, label: 'Bus History', color: 'from-indigo-500 to-blue-500' },
    { icon: MessageSquare, label: 'Support', color: 'from-pink-500 to-rose-500' }
  ];

  const stats = [
    { icon: Bus, label: 'Assigned Bus', value: busData.busNumber, color: 'from-blue-500 to-cyan-500' },
    { icon: MapPin, label: 'Current Location', value: busData.currentLocation, color: 'from-purple-500 to-pink-500' },
    { icon: Clock, label: 'Estimated Arrival', value: busData.estimatedArrival, color: 'from-green-500 to-emerald-500' },
    { icon: CheckCircle, label: "Today's Attendance", value: 'Present', color: 'from-orange-500 to-red-500' }
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  {/* For Debugging Purpose */ }
    useEffect(() => {
      if (user?.name) {
        console.log(user.name);
      }
    }, [user]);

  const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 md:p-12 shadow-2xl">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">Live Tracking Active</span>
              </div>

              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Hello, {studentData.name}! 👋</h1>
                <p className="text-blue-100 text-lg">{studentData.studentId} • {studentData.department}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Bus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">Current Status</p>
                    <p className="text-white text-xl font-bold">Your Bus is On The Way 🚍</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-white/90">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Estimated arrival in <span className="font-bold">{busData.estimatedArrival}</span></span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2">
                  <Navigation className="w-5 h-5" />
                  <span>Track Bus Live</span>
                </button>
                <button className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20 flex items-center space-x-2">
                  <Route className="w-5 h-5" />
                  <span>View Route</span>
                </button>
              </div>
            </div>

            <div className="hidden md:flex items-center justify-center">
              <div className="relative">
                <div className="w-64 h-64 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center animate-float">
                  <Bus className="w-32 h-32 text-white" />
                </div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-400 rounded-full flex items-center justify-center animate-pulse">
                  <Radio className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer overflow-hidden">
              <div className="relative z-10">
                <div className={`w-14 h-14 bg-linear-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
                <p className="text-gray-500 text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{stat.value}</p>
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-linear-to-br from-blue-50 to-indigo-50 rounded-tl-full opacity-50"></div>
            </div>
          ))}
        </div>

        {/* Live Bus Tracking Section */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Live Bus Tracking</h2>
                  <p className="text-blue-100 text-sm">Real-time location updates</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">Live</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                    <p className="text-gray-600 text-sm mb-1">Bus Number</p>
                    <p className="text-xl font-bold text-gray-800">{busData.busNumber}</p>
                  </div>
                  <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-4">
                    <p className="text-gray-600 text-sm mb-1">Current Speed</p>
                    <p className="text-xl font-bold text-gray-800">{busData.currentSpeed}</p>
                  </div>
                </div>

                <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-linear-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Driver Name</p>
                      <p className="text-xl font-bold text-gray-800">{busData.driverName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-medium">{busData.driverPhone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Last Updated: {busData.lastUpdated}</span>
                  <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
                    <Activity className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <div className="relative bg-linear-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden h-80">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                      <MapPin className="w-10 h-10 text-blue-600 animate-bounce" />
                    </div>
                    <p className="text-gray-600 font-medium">Interactive Map</p>
                    <p className="text-sm text-gray-500">Live bus location tracking</p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse"></div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button className="flex-1 sm:flex-none px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2">
                <Navigation className="w-5 h-5" />
                <span>Open Full Map</span>
              </button>
              <button className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center space-x-2">
                <Share2 className="w-5 h-5" />
                <span>Share Location</span>
              </button>
            </div>
          </div>
        </div>

        {/* Today's Journey Timeline & Bus Details */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl p-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-linear-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Route className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Today's Journey</h2>
                <p className="text-gray-500 text-sm">Track your bus route progress</p>
              </div>
            </div>

            <div className="space-y-6">
              {journeySteps.map((step, index) => (
                <div key={step.id} className="relative flex items-start space-x-4">
                  {index !== journeySteps.length - 1 && (
                    <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-linear-to-b from-blue-500 to-indigo-500"></div>
                  )}

                  <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${step.status === 'completed' ? 'bg-linear-to-br from-green-500 to-emerald-600' :
                    step.status === 'current' ? 'bg-linear-to-br from-blue-500 to-indigo-600 animate-pulse' :
                      'bg-gray-200'
                    }`}>
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : step.status === 'current' ? (
                      <Radio className="w-6 h-6 text-white" />
                    ) : (
                      <Clock className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 pb-8">
                    <div className={`rounded-xl p-4 ${step.status === 'current' ? 'bg-linear-to-r from-blue-50 to-indigo-50 border-2 border-blue-200' :
                      step.status === 'completed' ? 'bg-green-50' :
                        'bg-gray-50'
                      }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-800">{step.name}</h3>
                        <span className={`text-sm font-semibold ${step.status === 'current' ? 'text-blue-600' :
                          step.status === 'completed' ? 'text-green-600' :
                            'text-gray-500'
                          }`}>{step.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{step.location}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Bus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Bus Details</h2>
                <p className="text-gray-500 text-sm">Your assigned bus</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-center">
                <p className="text-gray-600 text-sm mb-1">Bus Number</p>
                <p className="text-3xl font-bold text-gray-800">{busData.busNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-600 text-xs mb-1">Capacity</p>
                  <p className="text-lg font-bold text-gray-800">{busData.capacity}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-600 text-xs mb-1">Available</p>
                  <p className="text-lg font-bold text-green-600">{busData.availableSeats}</p>
                </div>
              </div>

              <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-linear-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Driver</p>
                    <p className="font-bold text-gray-800">{busData.driverName}</p>
                  </div>
                </div>
                <button className="w-full py-2 bg-white rounded-lg text-sm font-semibold text-green-600 hover:bg-green-50 transition-all flex items-center justify-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>{busData.driverPhone}</span>
                </button>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-gray-600 text-xs mb-1">Route Name</p>
                <p className="font-bold text-gray-800">{busData.routeName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications & Schedule */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-linear-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
                  <p className="text-gray-500 text-sm">Recent updates</p>
                </div>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Mark all read</button>
            </div>

            <div className="space-y-3">
              {recentNotifications.map((notification) => (
                <div key={notification.id} className={`p-4 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer ${notification.read ? 'bg-gray-50 border-gray-100' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${notification.type === 'warning' ? 'bg-yellow-100' :
                      notification.type === 'success' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                      {notification.type === 'warning' ? (
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                      ) : notification.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Bell className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-800 text-sm">{notification.title}</h3>
                        {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                      <p className="text-xs text-gray-400">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Upcoming Schedule</h2>
                <p className="text-gray-500 text-sm">Your bus timings</p>
              </div>
            </div>

            <div className="space-y-3">
              {upcomingSchedule.map((schedule, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-linear-to-r from-gray-50 to-blue-50 rounded-xl hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{schedule.date}</p>
                      <p className="text-sm text-gray-600">{schedule.time} • {schedule.route}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${schedule.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {schedule.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency Section */}
        <div className="bg-linear-to-br from-red-500 via-pink-500 to-rose-600 rounded-3xl shadow-2xl p-8 text-white">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Emergency Contacts</h2>
              <p className="text-red-100">Quick access to help</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-2xl p-6 transition-all transform hover:scale-105 border border-white/30">
              <Phone className="w-8 h-8 text-white mb-3" />
              <p className="font-bold text-lg mb-1">Call Driver</p>
              <p className="text-sm text-red-100">{busData.driverPhone}</p>
            </button>
            <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-2xl p-6 transition-all transform hover:scale-105 border border-white/30">
              <AlertCircle className="w-8 h-8 text-white mb-3" />
              <p className="font-bold text-lg mb-1">Emergency</p>
              <p className="text-sm text-red-100">University Security</p>
            </button>
            <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-2xl p-6 transition-all transform hover:scale-105 border border-white/30">
              <Share2 className="w-8 h-8 text-white mb-3" />
              <p className="font-bold text-lg mb-1">Share Location</p>
              <p className="text-sm text-red-100">Send to contacts</p>
            </button>
          </div>
        </div>

        {/* Announcements Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-linear-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Announcements</h2>
                <p className="text-gray-500 text-sm">Latest university notices</p>
              </div>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="group bg-linear-to-brrom-gray-50 to-blue-50 rounded-2xl p-6 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{announcement.category}</span>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{announcement.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{announcement.excerpt}</p>
                <p className="text-xs text-gray-400">{announcement.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-linear-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Quick Actions</h2>
              <p className="text-gray-500 text-sm">Frequently used features</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (
              <button key={index} className="group bg-linear-to-br from-gray-50 to-blue-50 rounded-2xl p-6 hover:shadow-xl transition-all transform hover:-translate-y-1">
                <div className={`w-14 h-14 bg-linear-to-br ${action.color} rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform shadow-lg`}>
                  <action.icon className="w-7 h-7 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-700 text-center group-hover:text-blue-600 transition-colors">{action.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Bus className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800">University Bus Tracking System</p>
                <p className="text-xs text-gray-500">Making campus commute easier</p>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>Support: +91 1800-123-4567</span>
              <span>Version 2.0.0</span>
            </div>
            <p className="text-sm text-gray-500">© 2026 University. All rights reserved.</p>
          </div>
        </footer>
    </div>
  );
};

export default StudentHome;

// Made with Bob

// Seed events (original 9 events enriched with lineup, gallery, reviews, FAQ, location).
// Lineup photos / gallery images are placeholders; replace with real ones.
export const seedEvents = [
  {
    "title": "Coldplay — Music of the Spheres",
    "artist": "Coldplay",
    "subtitle": "Music of the Spheres World Tour",
    "genre": "Pop",
    "genre_slug": "pop",
    "city": "Mumbai",
    "city_slug": "mumbai",
    "venue": "DY Patil Stadium",
    "date": "17 March 2026",
    "time": "7:00 PM",
    "image": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    "hero_image": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    "description": "Experience an unforgettable night of live music with your favourite artists worldwide. Lights, lasers and love.",
    "is_live": true,
    "tiers": [
      {
        "name": "General",
        "price": 2499,
        "note": "Standing",
        "perks": [
          "Entry to the main arena",
          "Access to food & drink stalls",
          "Free cloakroom for small bags"
        ]
      },
      {
        "name": "Gold",
        "price": 5999,
        "note": "Reserved",
        "perks": [
          "Priority entry lane",
          "Reserved / elevated viewing",
          "Complimentary welcome drink"
        ]
      },
      {
        "name": "VIP",
        "price": 14999,
        "note": "Limited Seats",
        "perks": [
          "Fast-track entry",
          "Premium viewing zone",
          "Dedicated lounge & bar"
        ]
      }
    ],
    "created_at": "2026-10-07T14:03:21.235219+00:00",
    "id": "6ac651293bdd3307eb7b8ae3",
    "lineup": [
      {
        "name": "Nila Vora",
        "role": "Opening act",
        "set_time": "7:00 PM",
        "photo": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
      },
      {
        "name": "The Midnight Orchard",
        "role": "Support",
        "set_time": "7:50 PM",
        "photo": "https://images.pexels.com/photos/8448547/pexels-photo-8448547.jpeg"
      },
      {
        "name": "Coldplay",
        "role": "Headliner",
        "set_time": "8:45 PM",
        "photo": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
      }
    ],
    "gallery": [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1517983079452-bbaa6a081a6b",
      "https://images.unsplash.com/photo-1706402500342-2cbc85c480bf?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1600"
    ],
    "reviews": [
      {
        "name": "Priya S.",
        "rating": 5,
        "date": "Feb 2026",
        "comment": "Crowd management at the last stadium show was smooth and the sound reached the back stands clearly."
      },
      {
        "name": "Rahul M.",
        "rating": 5,
        "date": "Jan 2026",
        "comment": "Wristband lights and the big screens made the whole night feel like one giant singalong."
      },
      {
        "name": "Ananya K.",
        "rating": 4,
        "date": "Jan 2026",
        "comment": "Brilliant show. Exit traffic took a while, so plan your ride home in advance."
      }
    ],
    "faqs": [
      {
        "q": "What is the age limit?",
        "a": "All ages are welcome. Every attendee, including children, needs a valid ticket."
      },
      {
        "q": "Which ID should I carry?",
        "a": "Carry the same government photo ID you used while booking. The name on the ID must match the name on your ticket."
      },
      {
        "q": "Where do I find my ticket?",
        "a": "Your e-ticket appears under My Tickets right after payment. Show it at the gate."
      },
      {
        "q": "Can I get a refund?",
        "a": "Tickets are non-refundable unless the event is cancelled or rescheduled by the organiser."
      },
      {
        "q": "What can I bring inside?",
        "a": "Small bags are fine. Outside food, drinks, professional cameras and sharp objects are not allowed."
      },
      {
        "q": "Is there parking at the venue?",
        "a": "Parking near the stadium is limited, so we recommend public transport or a pre-booked cab."
      }
    ],
    "location": {
      "address": "DY Patil Stadium, Nerul, Navi Mumbai",
      "getting_there": "The nearest railway station is Nerul on the Harbour line. Expect heavy traffic on show day, so trains plus a short auto ride are usually quickest.",
      "parking": "On-site parking is limited. Carpool or use public transport if you can."
    },
    "info": {
      "age_limit": "All ages",
      "doors_open": "5:30 PM",
      "duration": "Approx. 4 hrs"
    }
  },
  {
    "title": "Tomorrowland India",
    "artist": "Various Artists",
    "subtitle": "Festival of Festivals",
    "genre": "EDM",
    "genre_slug": "edm",
    "city": "Goa",
    "city_slug": "goa",
    "venue": "Vagator Beach Grounds",
    "date": "22 March 2026",
    "time": "4:00 PM",
    "image": "https://images.unsplash.com/photo-1506157786151-b8491531f063?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    "hero_image": "https://images.unsplash.com/photo-1506157786151-b8491531f063?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    "description": "A legendary beach rave with pyro, world-class DJs and sunrise sets by the Arabian Sea.",
    "is_live": true,
    "tiers": [
      {
        "name": "General",
        "price": 3499,
        "note": "Dance Floor",
        "perks": [
          "Entry to the main arena",
          "Access to food & drink stalls",
          "Free cloakroom for small bags"
        ]
      },
      {
        "name": "Gold",
        "price": 7999,
        "note": "Elevated Deck",
        "perks": [
          "Priority entry lane",
          "Reserved / elevated viewing",
          "Complimentary welcome drink"
        ]
      },
      {
        "name": "VIP",
        "price": 19999,
        "note": "Backstage",
        "perks": [
          "Fast-track entry",
          "Premium viewing zone",
          "Dedicated lounge & bar"
        ]
      }
    ],
    "created_at": "2026-10-07T14:03:21.235815+00:00",
    "id": "6ac651293bdd3307eb7b8ae4",
    "lineup": [
      {
        "name": "DJ Kairo",
        "role": "Opening act",
        "set_time": "4:00 PM",
        "photo": "https://images.unsplash.com/photo-1506157786151-b8491531f063?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
      },
      {
        "name": "Mira Solis",
        "role": "Main stage",
        "set_time": "5:30 PM",
        "photo": "https://images.unsplash.com/photo-1517983079452-bbaa6a081a6b"
      },
      {
        "name": "Vantage",
        "role": "Main stage",
        "set_time": "7:00 PM",
        "photo": "https://images.unsplash.com/photo-1706402500342-2cbc85c480bf?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
      },
      {
        "name": "Nova Rae",
        "role": "Sunset set",
        "set_time": "8:30 PM",
        "photo": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
      },
      {
        "name": "Aether Collective",
        "role": "Headliner",
        "set_time": "10:00 PM",
        "photo": "https://images.unsplash.com/photo-1506157786151-b8491531f063?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
      }
    ],
    "gallery": [
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.pexels.com/photos/8448547/pexels-photo-8448547.jpeg",
      "https://images.pexels.com/photos/28520254/pexels-photo-28520254.jpeg",
      "https://images.unsplash.com/photo-1694340309722-564b69c19c35?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
    ],
    "reviews": [
      {
        "name": "Karan P.",
        "rating": 5,
        "date": "Dec 2025",
        "comment": "Sunset sets by the water with proper pyro and visuals. Easily the best festival production I have seen."
      },
      {
        "name": "Sneha R.",
        "rating": 4,
        "date": "Dec 2025",
        "comment": "Great lineup and sound. Carry sunscreen and water because the afternoon is hot."
      },
      {
        "name": "Vikram D.",
        "rating": 5,
        "date": "Nov 2025",
        "comment": "The Gold deck gave a perfect view of the main stage without the crush."
      }
    ],
    "faqs": [
      {
        "q": "What is the age limit?",
        "a": "This is an 18+ event. Alcohol is served only to guests of legal drinking age."
      },
      {
        "q": "Which ID should I carry?",
        "a": "Carry the same government photo ID you used while booking. The name on the ID must match the name on your ticket."
      },
      {
        "q": "Where do I find my ticket?",
        "a": "Your e-ticket appears under My Tickets right after payment. Show it at the gate."
      },
      {
        "q": "Can I get a refund?",
        "a": "Tickets are non-refundable unless the event is cancelled or rescheduled by the organiser."
      },
      {
        "q": "Is re-entry allowed?",
        "a": "Re-entry is not permitted once you leave the festival grounds."
      },
      {
        "q": "What should I wear?",
        "a": "Light, comfortable clothing and closed shoes. Sunglasses and sunscreen are a good idea for the afternoon sets."
      }
    ],
    "location": {
      "address": "Vagator Beach Grounds, Vagator, Goa",
      "getting_there": "There is no railway station nearby. Taxis or scooter rentals from Anjuna or Mapusa work best, and it is wise to pre-book your return ride.",
      "parking": "Parking nearby is limited. Ride-share and pre-booked taxis are recommended."
    },
    "info": {
      "age_limit": "18+",
      "doors_open": "3:00 PM",
      "duration": "Approx. 9 hrs"
    }
  },
  {
    "title": "Kiki Presents: Bollywood Nights",
    "artist": "DJ Nucleya",
    "subtitle": "Bollywood x Bass",
    "genre": "Hip Hop",
    "genre_slug": "hiphop",
    "city": "Mumbai",
    "city_slug": "mumbai",
    "venue": "Kiki, Bandra West",
    "date": "28 March 2026",
    "time": "10:00 PM",
    "image": "https://images.pexels.com/photos/8448547/pexels-photo-8448547.jpeg",
    "hero_image": "https://images.pexels.com/photos/8448547/pexels-photo-8448547.jpeg",
    "description": "Mumbai's hottest club turns up for a sweaty Bollywood-trap crossover with Nucleya on the decks.",
    "is_live": false,
    "tiers": [
      {
        "name": "Stag",
        "price": 1999,
        "note": "Entry + 1 drink",
        "perks": [
          "Single entry",
          "1 welcome drink included",
          "Access to the main floor"
        ]
      },
      {
        "name": "Couple",
        "price": 2999,
        "note": "Entry + 2 drinks",
        "perks": [
          "Entry for two",
          "2 welcome drinks included",
          "Access to the main floor"
        ]
      },
      {
        "name": "VIP",
        "price": 7999,
        "note": "Table of 4",
        "perks": [
          "Fast-track entry",
          "Premium viewing zone",
          "Dedicated lounge & bar"
        ]
      }
    ],
    "created_at": "2026-10-07T14:03:21.236165+00:00",
    "id": "6ac651293bdd3307eb7b8ae5",
    "lineup": [
      {
        "name": "DJ Rhea K",
        "role": "Warm-up",
        "set_time": "10:00 PM",
        "photo": "https://images.pexels.com/photos/8448547/pexels-photo-8448547.jpeg"
      },
      {
        "name": "DJ Nucleya",
        "role": "Headliner",
        "set_time": "11:30 PM",
        "photo": "https://images.pexels.com/photos/8448547/pexels-photo-8448547.jpeg"
      }
    ],
    "gallery": [
      "https://images.pexels.com/photos/8448547/pexels-photo-8448547.jpeg",
      "https://images.unsplash.com/photo-1517983079452-bbaa6a081a6b",
      "https://images.unsplash.com/photo-1706402500342-2cbc85c480bf?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1600",
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
    ],
    "reviews": [
      {
        "name": "Meera J.",
        "rating": 5,
        "date": "Feb 2026",
        "comment": "The bass and the Bollywood remixes had the whole floor jumping until closing."
      },
      {
        "name": "Arjun T.",
        "rating": 4,
        "date": "Feb 2026",
        "comment": "Fun night. Get there early because the floor fills up fast after 11."
      },
      {
        "name": "Ishita B.",
        "rating": 4,
        "date": "Jan 2026",
        "comment": "Friendly staff and quick entry once your ID is checked."
      }
    ],
    "faqs": [
      {
        "q": "What is the age limit?",
        "a": "This is an 18+ club night. Alcohol is served only to guests of legal drinking age."
      },
      {
        "q": "Which ID should I carry?",
        "a": "Carry the same government photo ID you used while booking. The name on the ID must match the name on your ticket."
      },
      {
        "q": "Where do I find my ticket?",
        "a": "Your e-ticket appears under My Tickets right after payment. Show it at the gate."
      },
      {
        "q": "Can I get a refund?",
        "a": "Tickets are non-refundable unless the event is cancelled or rescheduled by the organiser."
      },
      {
        "q": "What is the dress code?",
        "a": "Smart casual. Sports sandals and sleeveless gym wear may be refused at the door."
      },
      {
        "q": "What does the entry cover charge include?",
        "a": "The tier note on each ticket shows what is included, for example entry plus drinks."
      }
    ],
    "location": {
      "address": "Kiki, Bandra West, Mumbai",
      "getting_there": "Bandra West is easy to reach by cab or ride-hailing, even late at night. Share your live location with the driver.",
      "parking": "Street parking is limited. A cab is the easiest option."
    },
    "info": {
      "age_limit": "18+",
      "doors_open": "9:30 PM",
      "duration": "Approx. 4 hrs"
    }
  },
  {
    "title": "Ballrs After Dark",
    "artist": "Anish Sood",
    "subtitle": "House & Melodic Techno",
    "genre": "Techno",
    "genre_slug": "techno",
    "city": "Pune",
    "city_slug": "pune",
    "venue": "Ballrs, Koregaon Park",
    "date": "30 March 2026",
    "time": "9:30 PM",
    "image": "https://images.unsplash.com/photo-1517983079452-bbaa6a081a6b",
    "hero_image": "https://images.unsplash.com/photo-1517983079452-bbaa6a081a6b",
    "description": "Pune's party HQ hosts Anish Sood for a 5-hour melodic techno marathon under neon lights.",
    "is_live": true,
    "tiers": [
      {
        "name": "Stag",
        "price": 1499,
        "note": "Entry + 1 drink",
        "perks": [
          "Single entry",
          "1 welcome drink included",
          "Access to the main floor"
        ]
      },
      {
        "name": "Couple",
        "price": 2499,
        "note": "Entry + 2 drinks",
        "perks": [
          "Entry for two",
          "2 welcome drinks included",
          "Access to the main floor"
        ]
      },
      {
        "name": "VIP",
        "price": 6999,
        "note": "Booth",
        "perks": [
          "Fast-track entry",
          "Premium viewing zone",
          "Dedicated lounge & bar"
        ]
      }
    ],
    "created_at": "2026-10-07T14:03:21.236570+00:00",
    "id": "6ac651293bdd3307eb7b8ae6",
    "lineup": [
      {
        "name": "Kabir Dev",
        "role": "Opening act",
        "set_time": "9:30 PM",
        "photo": "https://images.unsplash.com/photo-1517983079452-bbaa6a081a6b"
      },
      {
        "name": "Anish Sood",
        "role": "Headliner",
        "set_time": "11:00 PM",
        "photo": "https://images.unsplash.com/photo-1517983079452-bbaa6a081a6b"
      },
      {
        "name": "Lumi",
        "role": "After-hours set",
        "set_time": "12:45 AM",
        "photo": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
      }
    ],
    "gallery": [
      "https://images.unsplash.com/photo-1517983079452-bbaa6a081a6b",
      "https://images.pexels.com/photos/28520254/pexels-photo-28520254.jpeg",
      "https://images.unsplash.com/photo-1694340309722-564b69c19c35?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.pexels.com/photos/8448547/pexels-photo-8448547.jpeg"
    ],
    "reviews": [
      {
        "name": "Rohan G.",
        "rating": 5,
        "date": "Feb 2026",
        "comment": "Neon lighting and a tight melodic techno set. The five-hour format is exactly right."
      },
      {
        "name": "Tanvi L.",
        "rating": 4,
        "date": "Jan 2026",
        "comment": "Great sound system. The booth tier is worth it if you want a spot to sit."
      },
      {
        "name": "Aditya N.",
        "rating": 4,
        "date": "Jan 2026",
        "comment": "Smooth entry and a very well-run bar."
      }
    ],
    "faqs": [
      {
        "q": "What is the age limit?",
        "a": "This is an 18+ club night. Alcohol is served only to guests of legal drinking age."
      },
      {
        "q": "Which ID should I carry?",
        "a": "Carry the same government photo ID you used while booking. The name on the ID must match the name on your ticket."
      },
      {
        "q": "Where do I find my ticket?",
        "a": "Your e-ticket appears under My Tickets right after payment. Show it at the gate."
      },
      {
        "q": "Can I get a refund?",
        "a": "Tickets are non-refundable unless the event is cancelled or rescheduled by the organiser."
      },
      {
        "q": "Can I reserve a booth?",
        "a": "Yes. The VIP tier includes a booth. Pick it on the event page and complete booking."
      }
    ],
    "location": {
      "address": "Ballrs, Koregaon Park, Pune",
      "getting_there": "Koregaon Park is a short ride from Pune Junction. Cabs and ride-hailing are the easiest option at night.",
      "parking": "Parking is limited. Use a cab if you plan to drink."
    },
    "info": {
      "age_limit": "18+",
      "doors_open": "9:00 PM",
      "duration": "Approx. 5 hrs"
    }
  },
  {
    "title": "Plunge Pool Party",
    "artist": "Sunburn Residents",
    "subtitle": "Daytime House",
    "genre": "EDM",
    "genre_slug": "edm",
    "city": "Goa",
    "city_slug": "goa",
    "venue": "Plunge, Candolim",
    "date": "5 April 2026",
    "time": "2:00 PM",
    "image": "https://images.pexels.com/photos/28520254/pexels-photo-28520254.jpeg",
    "hero_image": "https://images.pexels.com/photos/28520254/pexels-photo-28520254.jpeg",
    "description": "Day-glow pool party with foam cannons, sunset house sets and Goan feni cocktails.",
    "is_live": false,
    "tiers": [
      {
        "name": "Stag",
        "price": 1799,
        "note": "Pool Access",
        "perks": [
          "Single entry",
          "1 welcome drink included",
          "Access to the main floor"
        ]
      },
      {
        "name": "Couple",
        "price": 2799,
        "note": "Pool + 2 drinks",
        "perks": [
          "Entry for two",
          "2 welcome drinks included",
          "Access to the main floor"
        ]
      },
      {
        "name": "VIP",
        "price": 8999,
        "note": "Cabana",
        "perks": [
          "Fast-track entry",
          "Premium viewing zone",
          "Dedicated lounge & bar"
        ]
      }
    ],
    "created_at": "2026-10-07T14:03:21.236974+00:00",
    "id": "6ac651293bdd3307eb7b8ae7",
    "lineup": [
      {
        "name": "Rohan Shetty",
        "role": "Poolside warm-up",
        "set_time": "2:00 PM",
        "photo": "https://images.pexels.com/photos/28520254/pexels-photo-28520254.jpeg"
      },
      {
        "name": "Sunburn Residents",
        "role": "Headliner",
        "set_time": "3:30 PM",
        "photo": "https://images.pexels.com/photos/28520254/pexels-photo-28520254.jpeg"
      },
      {
        "name": "Zoya Mir",
        "role": "Sunset set",
        "set_time": "5:30 PM",
        "photo": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
      }
    ],
    "gallery": [
      "https://images.pexels.com/photos/28520254/pexels-photo-28520254.jpeg",
      "https://images.unsplash.com/photo-1706402500342-2cbc85c480bf?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1600",
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1517983079452-bbaa6a081a6b"
    ],
    "reviews": [
      {
        "name": "Naina V.",
        "rating": 5,
        "date": "Mar 2026",
        "comment": "Day-time pool party with a proper sound system. The cabana tier is great value for a group."
      },
      {
        "name": "Dev A.",
        "rating": 4,
        "date": "Feb 2026",
        "comment": "Brilliant vibe. Bring a towel and spare clothes."
      },
      {
        "name": "Shruti P.",
        "rating": 4,
        "date": "Feb 2026",
        "comment": "Relaxed crowd and quick service at the bar."
      }
    ],
    "faqs": [
      {
        "q": "What is the age limit?",
        "a": "This is an 18+ party. Alcohol is served only to guests of legal drinking age."
      },
      {
        "q": "Which ID should I carry?",
        "a": "Carry the same government photo ID you used while booking. The name on the ID must match the name on your ticket."
      },
      {
        "q": "Where do I find my ticket?",
        "a": "Your e-ticket appears under My Tickets right after payment. Show it at the gate."
      },
      {
        "q": "Can I get a refund?",
        "a": "Tickets are non-refundable unless the event is cancelled or rescheduled by the organiser."
      },
      {
        "q": "What should I bring?",
        "a": "Swimwear, a towel, sunscreen and a change of clothes. Valuables are best left at your hotel."
      },
      {
        "q": "Is the pool open to everyone?",
        "a": "Pool access is included in every tier."
      }
    ],
    "location": {
      "address": "Plunge, Candolim, Goa",
      "getting_there": "Candolim is roughly 15 km from Panaji. Taxis and scooter rentals work best.",
      "parking": "Parking is limited. Arrive by cab or bike."
    },
    "info": {
      "age_limit": "18+",
      "doors_open": "1:30 PM",
      "duration": "Approx. 6 hrs"
    }
  },
  {
    "title": "Di Mora: Jazz & Candlelight",
    "artist": "The Local Train (acoustic)",
    "subtitle": "Intimate Session",
    "genre": "Rock",
    "genre_slug": "rock",
    "city": "Delhi",
    "city_slug": "delhi",
    "venue": "Di Mora, Khan Market",
    "date": "12 April 2026",
    "time": "8:00 PM",
    "image": "https://images.unsplash.com/photo-1706402500342-2cbc85c480bf?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    "hero_image": "https://images.unsplash.com/photo-1706402500342-2cbc85c480bf?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    "description": "Candlelit acoustic evening with The Local Train — stripped-down, raw and unforgettable.",
    "is_live": false,
    "tiers": [
      {
        "name": "General",
        "price": 1299,
        "note": "Seated",
        "perks": [
          "Entry to the main arena",
          "Access to food & drink stalls",
          "Free cloakroom for small bags"
        ]
      },
      {
        "name": "Gold",
        "price": 2499,
        "note": "Front Row",
        "perks": [
          "Priority entry lane",
          "Reserved / elevated viewing",
          "Complimentary welcome drink"
        ]
      },
      {
        "name": "VIP",
        "price": 4999,
        "note": "Meet & Greet",
        "perks": [
          "Fast-track entry",
          "Premium viewing zone",
          "Dedicated lounge & bar"
        ]
      }
    ],
    "created_at": "2026-10-07T14:03:21.237316+00:00",
    "id": "6ac651293bdd3307eb7b8ae8",
    "lineup": [
      {
        "name": "Ira Fernandes Trio",
        "role": "Opening act",
        "set_time": "8:00 PM",
        "photo": "https://images.unsplash.com/photo-1706402500342-2cbc85c480bf?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
      },
      {
        "name": "The Local Train (acoustic)",
        "role": "Headliner",
        "set_time": "9:00 PM",
        "photo": "https://images.unsplash.com/photo-1706402500342-2cbc85c480bf?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
      }
    ],
    "gallery": [
      "https://images.unsplash.com/photo-1706402500342-2cbc85c480bf?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1694340309722-564b69c19c35?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.pexels.com/photos/8448547/pexels-photo-8448547.jpeg",
      "https://images.pexels.com/photos/28520254/pexels-photo-28520254.jpeg"
    ],
    "reviews": [
      {
        "name": "Kavya R.",
        "rating": 5,
        "date": "Feb 2026",
        "comment": "Candlelit tables and a stripped-back set made this feel intimate and special."
      },
      {
        "name": "Neil D.",
        "rating": 5,
        "date": "Jan 2026",
        "comment": "The front-row seats are worth it. You can hear every note."
      },
      {
        "name": "Aarti M.",
        "rating": 4,
        "date": "Jan 2026",
        "comment": "Lovely evening. Book early because seating is limited."
      }
    ],
    "faqs": [
      {
        "q": "What is the age limit?",
        "a": "This is an 18+ evening. Alcohol is served only to guests of legal drinking age."
      },
      {
        "q": "Which ID should I carry?",
        "a": "Carry the same government photo ID you used while booking. The name on the ID must match the name on your ticket."
      },
      {
        "q": "Where do I find my ticket?",
        "a": "Your e-ticket appears under My Tickets right after payment. Show it at the gate."
      },
      {
        "q": "Can I get a refund?",
        "a": "Tickets are non-refundable unless the event is cancelled or rescheduled by the organiser."
      },
      {
        "q": "Is the seating reserved?",
        "a": "General is seated, Gold is front row, and VIP includes a meet & greet. Seats are allotted on arrival within your tier."
      }
    ],
    "location": {
      "address": "Di Mora, Khan Market, New Delhi",
      "getting_there": "Khan Market has its own metro station on the Violet Line. Autos and cabs are easy to find nearby.",
      "parking": "Parking in Khan Market fills up quickly. The metro is recommended."
    },
    "info": {
      "age_limit": "18+",
      "doors_open": "7:30 PM",
      "duration": "Approx. 3 hrs"
    }
  },
  {
    "title": "AeroX Underground",
    "artist": "BLOT!",
    "subtitle": "Dark Techno Showcase",
    "genre": "Techno",
    "genre_slug": "techno",
    "city": "Bangalore",
    "city_slug": "bangalore",
    "venue": "AeroX, Indiranagar",
    "date": "19 April 2026",
    "time": "10:00 PM",
    "image": "https://images.unsplash.com/photo-1694340309722-564b69c19c35?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    "hero_image": "https://images.unsplash.com/photo-1694340309722-564b69c19c35?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    "description": "Deep, hypnotic techno in Bengaluru's most atmospheric warehouse space.",
    "is_live": false,
    "tiers": [
      {
        "name": "Stag",
        "price": 999,
        "note": "Entry",
        "perks": [
          "Single entry",
          "1 welcome drink included",
          "Access to the main floor"
        ]
      },
      {
        "name": "Couple",
        "price": 1799,
        "note": "Entry + 2 drinks",
        "perks": [
          "Entry for two",
          "2 welcome drinks included",
          "Access to the main floor"
        ]
      },
      {
        "name": "VIP",
        "price": 5999,
        "note": "Front Pit",
        "perks": [
          "Fast-track entry",
          "Premium viewing zone",
          "Dedicated lounge & bar"
        ]
      }
    ],
    "created_at": "2026-10-07T14:03:21.237626+00:00",
    "id": "6ac651293bdd3307eb7b8ae9",
    "lineup": [
      {
        "name": "Sahil Rao",
        "role": "Opening act",
        "set_time": "10:00 PM",
        "photo": "https://images.unsplash.com/photo-1694340309722-564b69c19c35?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
      },
      {
        "name": "BLOT!",
        "role": "Headliner",
        "set_time": "11:30 PM",
        "photo": "https://images.unsplash.com/photo-1694340309722-564b69c19c35?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
      },
      {
        "name": "Dhruv N",
        "role": "Closing set",
        "set_time": "1:15 AM",
        "photo": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
      }
    ],
    "gallery": [
      "https://images.unsplash.com/photo-1694340309722-564b69c19c35?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1600",
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1517983079452-bbaa6a081a6b",
      "https://images.unsplash.com/photo-1706402500342-2cbc85c480bf?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
    ],
    "reviews": [
      {
        "name": "Siddharth K.",
        "rating": 5,
        "date": "Feb 2026",
        "comment": "Dark room, heavy sound and a front pit that stays energetic all night."
      },
      {
        "name": "Pooja H.",
        "rating": 4,
        "date": "Jan 2026",
        "comment": "Great underground feel. Come early to beat the queue."
      },
      {
        "name": "Manav S.",
        "rating": 4,
        "date": "Jan 2026",
        "comment": "Strict but fair ID checks and a well-managed crowd."
      }
    ],
    "faqs": [
      {
        "q": "What is the age limit?",
        "a": "This is an 18+ club night. Alcohol is served only to guests of legal drinking age."
      },
      {
        "q": "Which ID should I carry?",
        "a": "Carry the same government photo ID you used while booking. The name on the ID must match the name on your ticket."
      },
      {
        "q": "Where do I find my ticket?",
        "a": "Your e-ticket appears under My Tickets right after payment. Show it at the gate."
      },
      {
        "q": "Can I get a refund?",
        "a": "Tickets are non-refundable unless the event is cancelled or rescheduled by the organiser."
      },
      {
        "q": "Is there a cloakroom?",
        "a": "Please travel light. Large bags may not be allowed inside."
      }
    ],
    "location": {
      "address": "AeroX, Indiranagar, Bangalore",
      "getting_there": "Indiranagar metro on the Purple Line is a short ride away. Cabs are easiest after midnight.",
      "parking": "Parking nearby is limited. A cab is recommended."
    },
    "info": {
      "age_limit": "18+",
      "doors_open": "9:30 PM",
      "duration": "Approx. 5 hrs"
    }
  },
  {
    "title": "Toit Rooftop Rock",
    "artist": "Parvaaz",
    "subtitle": "Live Band Night",
    "genre": "Rock",
    "genre_slug": "rock",
    "city": "Chandigarh",
    "city_slug": "chandigarh",
    "venue": "Toit Rooftop, Sector 26",
    "date": "26 April 2026",
    "time": "8:30 PM",
    "image": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    "hero_image": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    "description": "Kashmiri psych-rock legends Parvaaz on a Chandigarh rooftop under the stars.",
    "is_live": false,
    "tiers": [
      {
        "name": "General",
        "price": 899,
        "note": "Standing",
        "perks": [
          "Entry to the main arena",
          "Access to food & drink stalls",
          "Free cloakroom for small bags"
        ]
      },
      {
        "name": "Gold",
        "price": 1799,
        "note": "Seated",
        "perks": [
          "Priority entry lane",
          "Reserved / elevated viewing",
          "Complimentary welcome drink"
        ]
      },
      {
        "name": "VIP",
        "price": 3999,
        "note": "Front + Dinner",
        "perks": [
          "Fast-track entry",
          "Premium viewing zone",
          "Dedicated lounge & bar"
        ]
      }
    ],
    "created_at": "2026-10-07T14:03:21.237888+00:00",
    "id": "6ac651293bdd3307eb7b8aea",
    "lineup": [
      {
        "name": "Mehak & the Wild",
        "role": "Opening act",
        "set_time": "8:30 PM",
        "photo": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
      },
      {
        "name": "Parvaaz",
        "role": "Headliner",
        "set_time": "9:45 PM",
        "photo": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
      }
    ],
    "gallery": [
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.pexels.com/photos/8448547/pexels-photo-8448547.jpeg",
      "https://images.pexels.com/photos/28520254/pexels-photo-28520254.jpeg",
      "https://images.unsplash.com/photo-1694340309722-564b69c19c35?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
    ],
    "reviews": [
      {
        "name": "Gurleen K.",
        "rating": 5,
        "date": "Feb 2026",
        "comment": "Open sky, live rock and good food. A great way to spend a weekend evening."
      },
      {
        "name": "Harsh B.",
        "rating": 4,
        "date": "Jan 2026",
        "comment": "Sound carried well across the rooftop. Dinner packages move quickly."
      },
      {
        "name": "Simran T.",
        "rating": 5,
        "date": "Jan 2026",
        "comment": "The front and dinner tier was excellent value."
      }
    ],
    "faqs": [
      {
        "q": "What is the age limit?",
        "a": "This is an 18+ evening. Alcohol is served only to guests of legal drinking age."
      },
      {
        "q": "Which ID should I carry?",
        "a": "Carry the same government photo ID you used while booking. The name on the ID must match the name on your ticket."
      },
      {
        "q": "Where do I find my ticket?",
        "a": "Your e-ticket appears under My Tickets right after payment. Show it at the gate."
      },
      {
        "q": "Can I get a refund?",
        "a": "Tickets are non-refundable unless the event is cancelled or rescheduled by the organiser."
      },
      {
        "q": "What if it rains?",
        "a": "The organiser will announce any weather changes on the event page and by message to ticket holders."
      }
    ],
    "location": {
      "address": "Toit Rooftop, Sector 26, Chandigarh",
      "getting_there": "Sector 26 is well connected by cab and auto from across the city.",
      "parking": "Parking in the area is limited. Arrive early or take a cab."
    },
    "info": {
      "age_limit": "18+",
      "doors_open": "8:00 PM",
      "duration": "Approx. 3.5 hrs"
    }
  },
  {
    "title": "Hyderabad EDM Carnival",
    "artist": "Zaeden",
    "subtitle": "Mainstage Festival",
    "genre": "EDM",
    "genre_slug": "edm",
    "city": "Hyderabad",
    "city_slug": "hyderabad",
    "venue": "HITEX Grounds",
    "date": "3 May 2026",
    "time": "5:00 PM",
    "image": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    "hero_image": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    "description": "Mainstage pyrotechnics, confetti canons and Zaeden headlining a 6-hour EDM carnival.",
    "is_live": false,
    "tiers": [
      {
        "name": "General",
        "price": 1499,
        "note": "GA",
        "perks": [
          "Entry to the main arena",
          "Access to food & drink stalls",
          "Free cloakroom for small bags"
        ]
      },
      {
        "name": "Gold",
        "price": 3499,
        "note": "Elevated",
        "perks": [
          "Priority entry lane",
          "Reserved / elevated viewing",
          "Complimentary welcome drink"
        ]
      },
      {
        "name": "VIP",
        "price": 9999,
        "note": "Backstage",
        "perks": [
          "Fast-track entry",
          "Premium viewing zone",
          "Dedicated lounge & bar"
        ]
      }
    ],
    "created_at": "2026-10-07T14:03:21.238145+00:00",
    "id": "6ac651293bdd3307eb7b8aeb",
    "lineup": [
      {
        "name": "Vihaan",
        "role": "Opening act",
        "set_time": "5:00 PM",
        "photo": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
      },
      {
        "name": "Skyline Sisters",
        "role": "Main stage",
        "set_time": "6:30 PM",
        "photo": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
      },
      {
        "name": "Zaeden",
        "role": "Headliner",
        "set_time": "8:30 PM",
        "photo": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
      }
    ],
    "gallery": [
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1600",
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1517983079452-bbaa6a081a6b",
      "https://images.unsplash.com/photo-1706402500342-2cbc85c480bf?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
    ],
    "reviews": [
      {
        "name": "Sai T.",
        "rating": 5,
        "date": "Feb 2026",
        "comment": "Large grounds, clean sound and plenty of food stalls. The elevated area was great."
      },
      {
        "name": "Farah Q.",
        "rating": 4,
        "date": "Jan 2026",
        "comment": "Fantastic energy. Gates get busy around sunset, so arrive early."
      },
      {
        "name": "Nikhil C.",
        "rating": 4,
        "date": "Jan 2026",
        "comment": "Backstage tier is a different experience entirely."
      }
    ],
    "faqs": [
      {
        "q": "What is the age limit?",
        "a": "This is an 18+ event. Alcohol is served only to guests of legal drinking age."
      },
      {
        "q": "Which ID should I carry?",
        "a": "Carry the same government photo ID you used while booking. The name on the ID must match the name on your ticket."
      },
      {
        "q": "Where do I find my ticket?",
        "a": "Your e-ticket appears under My Tickets right after payment. Show it at the gate."
      },
      {
        "q": "Can I get a refund?",
        "a": "Tickets are non-refundable unless the event is cancelled or rescheduled by the organiser."
      },
      {
        "q": "Is there food and water inside?",
        "a": "Yes. Food and beverage stalls operate throughout the event."
      }
    ],
    "location": {
      "address": "HITEX Grounds, Hitech City, Hyderabad",
      "getting_there": "Hitech City is the nearest hub. HITEC City metro station plus a short cab ride works well.",
      "parking": "Parking is available around the grounds but fills quickly. Carpooling is encouraged."
    },
    "info": {
      "age_limit": "18+",
      "doors_open": "4:00 PM",
      "duration": "Approx. 6 hrs"
    }
  }
];

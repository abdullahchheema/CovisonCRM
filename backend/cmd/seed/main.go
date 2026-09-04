// Seed script — wipes all data and re-seeds demo data for development.
//
// Usage (from the backend/ directory):
//
//	go run ./cmd/seed
package main

import (
	"fmt"
	"log"
	"time"

	"tinycrm/config"
	"tinycrm/db"
	"tinycrm/models"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	config.Load()
	db.Connect()

	// ── Wipe all tables (children before parents to respect FK references) ───
	tables := []interface{}{
		&models.Note{}, &models.Deal{}, &models.Todo{}, &models.Column{},
		&models.Project{}, &models.Ticket{}, &models.EmailGroup{},
		&models.EmailTemplate{}, &models.Contact{}, &models.User{}, &models.Company{},
	}
	for _, t := range tables {
		if err := db.DB.Where("1 = 1").Delete(t).Error; err != nil {
			log.Fatalf("Failed to clear table for %T: %v", t, err)
		}
	}
	fmt.Println("✓ Cleared existing data")

	now := time.Now()

	// ── Company ───────────────────────────────────────────────────────────────
	companyID := models.NewUUID()

	// ── Users ─────────────────────────────────────────────────────────────────
	hash := func(p string) string {
		h, _ := bcrypt.GenerateFromPassword([]byte(p), 10)
		return string(h)
	}

	adminID := models.NewUUID()
	users := []models.User{
		// Admin — full access
		{
			ID:       adminID,
			Name:     "Alice Admin",
			Email:    "admin@acme.com",
			Password: hash("admin123"),
			Permissions: []string{
				"admin",
				"users-view", "users-edit", "users-delete",
				"contacts-view", "contacts-edit", "contacts-delete",
				"pipeline-view", "pipeline-edit", "pipeline-delete",
				"tickets-view", "tickets-edit", "tickets-delete",
				"projects-view", "projects-edit", "projects-delete",
			},
			Verified:  true,
			Date:      now,
			CompanyID: companyID,
			Company:   "Acme Corp",
		},
		// Manager — contacts + pipeline + tickets + projects, no user management
		{
			ID:       models.NewUUID(),
			Name:     "Mark Manager",
			Email:    "manager@acme.com",
			Password: hash("admin123"),
			Permissions: []string{
				"contacts-view", "contacts-edit", "contacts-delete",
				"pipeline-view", "pipeline-edit", "pipeline-delete",
				"tickets-view", "tickets-edit", "tickets-delete",
				"projects-view", "projects-edit", "projects-delete",
			},
			Verified:  true,
			Date:      now,
			CompanyID: companyID,
			Company:   "Acme Corp",
		},
		// Support — read contacts + pipeline, manage tickets only
		{
			ID:       models.NewUUID(),
			Name:     "Sam Support",
			Email:    "support@acme.com",
			Password: hash("admin123"),
			Permissions: []string{
				"contacts-view",
				"pipeline-view",
				"tickets-view", "tickets-edit",
			},
			Verified:  true,
			Date:      now,
			CompanyID: companyID,
			Company:   "Acme Corp",
		},
	}

	company := models.Company{
		ID:        companyID,
		Name:      "Acme Corp",
		CreatedBy: adminID,
		Number:    "+1 555 000 1234",
		Date:      now,
	}

	must(db.DB.Create(&company).Error)
	must(db.DB.Create(&users).Error)

	// ── Contacts ──────────────────────────────────────────────────────────────
	tomID := models.NewUUID()
	janeID := models.NewUUID()
	bruceID := models.NewUUID()
	dianaID := models.NewUUID()
	peterID := models.NewUUID()
	natashaID := models.NewUUID()

	contacts := []models.Contact{
		{
			ID: tomID, Name: "Tom Cruise", Email: "tom@globex.com",
			Number: "+1 555 100 0001", Company: "Globex", JobTitle: "CEO",
			Priority: "high", Status: "qualified", Probability: "0.8",
			LastActivity: now.AddDate(0, 0, -2), CreatedAt: now.AddDate(0, -1, 0),
		},
		{
			ID: janeID, Name: "Jane Foster", Email: "jane@initech.com",
			Number: "+1 555 100 0002", Company: "Initech", JobTitle: "VP Engineering",
			Priority: "medium", Status: "new", Probability: "0.4",
			LastActivity: now.AddDate(0, 0, -5), CreatedAt: now.AddDate(0, -2, 0),
		},
		{
			ID: bruceID, Name: "Bruce Banner", Email: "bruce@umbrella.com",
			Number: "+1 555 100 0003", Company: "Umbrella Corp", JobTitle: "Research Lead",
			Priority: "high", Status: "openDeal", Probability: "0.9",
			LastActivity: now.AddDate(0, 0, -1), CreatedAt: now.AddDate(0, -3, 0),
		},
		{
			ID: dianaID, Name: "Diana Prince", Email: "diana@waynetech.com",
			Number: "+1 555 100 0004", Company: "Wayne Tech", JobTitle: "CTO",
			Priority: "veryHigh", Status: "connected", Probability: "0.6",
			LastActivity: now, CreatedAt: now.AddDate(0, -1, -15),
		},
		{
			ID: peterID, Name: "Peter Parker", Email: "peter@dailybugle.com",
			Number: "+1 555 100 0005", Company: "Daily Bugle", JobTitle: "Journalist",
			Priority: "low", Status: "attempted", Probability: "0.2",
			LastActivity: now.AddDate(0, 0, -10), CreatedAt: now.AddDate(0, -4, 0),
		},
		{
			ID: natashaID, Name: "Natasha Romanoff", Email: "nat@shield.org",
			Number: "+1 555 100 0006", Company: "S.H.I.E.L.D", JobTitle: "Director",
			Priority: "veryHigh", Status: "won", Probability: "1.0",
			LastActivity: now.AddDate(0, 0, -3), CreatedAt: now.AddDate(0, -5, 0),
		},
	}
	must(db.DB.Create(&contacts).Error)

	// ── Tickets ───────────────────────────────────────────────────────────────
	tickets := []models.Ticket{
		{
			ID: models.NewUUID(), Title: "Login page throws 500 on Safari",
			Description: "Users on Safari 17 get a 500 error when submitting the login form.",
			Contact:     "Tom Cruise", Email: "tom@globex.com", Category: "bug",
			Priority: "critical", Status: "open", AssignedTo: "Sam Support",
			CreatedAt: now.AddDate(0, 0, -3), UpdatedAt: now.AddDate(0, 0, -3),
		},
		{
			ID: models.NewUUID(), Title: "Billing invoice not generating",
			Description: "Monthly invoice PDF is empty for accounts created after Nov 2024.",
			Contact:     "Bruce Banner", Email: "bruce@umbrella.com", Category: "support",
			Priority: "high", Status: "inProgress", AssignedTo: "Mark Manager",
			CreatedAt: now.AddDate(0, 0, -7), UpdatedAt: now.AddDate(0, 0, -2),
		},
		{
			ID: models.NewUUID(), Title: "Export contacts to CSV",
			Description: "Feature request: bulk export of filtered contacts as a CSV file.",
			Contact:     "Diana Prince", Email: "diana@waynetech.com", Category: "feature",
			Priority: "medium", Status: "onHold", AssignedTo: "Alice Admin",
			CreatedAt: now.AddDate(0, 0, -14), UpdatedAt: now.AddDate(0, 0, -5),
		},
		{
			ID: models.NewUUID(), Title: "Password reset email not arriving",
			Description: "Several users report not receiving the reset email. Checked spam folders.",
			Contact:     "Jane Foster", Email: "jane@initech.com", Category: "question",
			Priority: "high", Status: "resolved", AssignedTo: "Sam Support",
			CreatedAt: now.AddDate(0, 0, -10), UpdatedAt: now.AddDate(0, 0, -1),
		},
		{
			ID: models.NewUUID(), Title: "Add dark mode support",
			Description: "Customer request for dark mode across the dashboard.",
			Contact:     "Natasha Romanoff", Email: "nat@shield.org", Category: "feature",
			Priority: "low", Status: "closed", AssignedTo: "Mark Manager",
			CreatedAt: now.AddDate(0, -1, 0), UpdatedAt: now.AddDate(0, 0, -4),
		},
	}
	must(db.DB.Create(&tickets).Error)

	// ── Projects + columns + todos ────────────────────────────────────────────
	proj1ID := models.NewUUID()
	proj2ID := models.NewUUID()

	projects := []models.Project{
		{ID: proj1ID, Name: "Website Redesign", CreatedAt: now.AddDate(0, -1, 0)},
		{ID: proj2ID, Name: "CRM Onboarding", CreatedAt: now.AddDate(0, 0, -10)},
	}
	must(db.DB.Create(&projects).Error)

	col1Todo, col1Prog, col1Done := models.NewUUID(), models.NewUUID(), models.NewUUID()
	col2Todo, col2Prog, col2Done := models.NewUUID(), models.NewUUID(), models.NewUUID()

	columns := []models.Column{
		{ID: col1Todo, ProjectID: proj1ID, Name: "Todo", Order: 0, CreatedAt: now},
		{ID: col1Prog, ProjectID: proj1ID, Name: "In Progress", Order: 1, CreatedAt: now},
		{ID: col1Done, ProjectID: proj1ID, Name: "Done", Order: 2, CreatedAt: now},
		{ID: col2Todo, ProjectID: proj2ID, Name: "Todo", Order: 0, CreatedAt: now},
		{ID: col2Prog, ProjectID: proj2ID, Name: "In Progress", Order: 1, CreatedAt: now},
		{ID: col2Done, ProjectID: proj2ID, Name: "Done", Order: 2, CreatedAt: now},
	}
	must(db.DB.Create(&columns).Error)

	todos := []models.Todo{
		{
			ID: models.NewUUID(), ProjectID: proj1ID, ColumnID: col1Todo,
			Title: "Create Minimal Logo", Description: "Design a clean logo for the new brand identity.",
			Author:      models.TodoAuthor{Name: "Alice Admin", Image: "/static/avatar/001-man.svg"},
			StatusColor: "#2499EF", CreatedAt: now.AddDate(0, 0, -5),
		},
		{
			ID: models.NewUUID(), ProjectID: proj1ID, ColumnID: col1Todo,
			Title: "Write Homepage Copy", Description: "Craft hero section and feature descriptions.",
			Author:      models.TodoAuthor{Name: "Mark Manager", Image: "/static/avatar/002-girl.svg"},
			StatusColor: "#FF9777", CreatedAt: now.AddDate(0, 0, -4),
		},
		{
			ID: models.NewUUID(), ProjectID: proj1ID, ColumnID: col1Prog,
			Title: "Build Component Library", Description: "Set up shadcn/ui components with design tokens.",
			Author:      models.TodoAuthor{Name: "Alice Admin", Image: "/static/avatar/001-man.svg"},
			StatusColor: "#2499EF", CreatedAt: now.AddDate(0, 0, -8),
		},
		{
			ID: models.NewUUID(), ProjectID: proj1ID, ColumnID: col1Prog,
			Title: "Responsive Layout", Description: "Ensure all pages work on mobile and tablet.",
			Author:      models.TodoAuthor{Name: "Sam Support", Image: "/static/avatar/005-man-1.svg"},
			StatusColor: "#FF6B93", CreatedAt: now.AddDate(0, 0, -6),
		},
		{
			ID: models.NewUUID(), ProjectID: proj1ID, ColumnID: col1Done,
			Title: "Set Up Vite + Tailwind", Description: "Bootstrap project with Vite, React, and Tailwind CSS.",
			Author:      models.TodoAuthor{Name: "Alice Admin", Image: "/static/avatar/001-man.svg"},
			StatusColor: "#2499EF", CreatedAt: now.AddDate(0, -1, 0),
		},
		{
			ID: models.NewUUID(), ProjectID: proj2ID, ColumnID: col2Todo,
			Title: "Import Client List", Description: "Upload and map 500 contacts from the old CRM.",
			Author:      models.TodoAuthor{Name: "Mark Manager", Image: "/static/avatar/002-girl.svg"},
			StatusColor: "#FF9777", CreatedAt: now.AddDate(0, 0, -3),
		},
		{
			ID: models.NewUUID(), ProjectID: proj2ID, ColumnID: col2Prog,
			Title: "Configure Email Templates", Description: "Set up welcome and follow-up email sequences.",
			Author:      models.TodoAuthor{Name: "Alice Admin", Image: "/static/avatar/001-man.svg"},
			StatusColor: "#2499EF", CreatedAt: now.AddDate(0, 0, -5),
		},
		{
			ID: models.NewUUID(), ProjectID: proj2ID, ColumnID: col2Done,
			Title: "Team Training Session", Description: "Onboard 3 team members to the new CRM workflow.",
			Author:      models.TodoAuthor{Name: "Sam Support", Image: "/static/avatar/011-man-2.svg"},
			StatusColor: "#A855F7", CreatedAt: now.AddDate(0, 0, -9),
		},
	}
	must(db.DB.Create(&todos).Error)

	// ── Email Templates ───────────────────────────────────────────────────────
	emailTemplates := []models.EmailTemplate{
		{
			ID:        models.NewUUID(),
			Name:      "Welcome Onboarding",
			Subject:   "Welcome to Acme Corp — let's get started!",
			Body:      "Hi {{name}},\n\nWe're thrilled to have you on board. Here's everything you need to get started with Acme Corp...\n\nBest,\nThe Acme Team",
			Recipient: "new-clients",
			Frequency: "one-time",
			SendDate:  now.AddDate(0, 0, 1).Format("2006-01-02"),
			SendTime:  "09:00",
			Status:    "active",
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			ID:        models.NewUUID(),
			Name:      "Weekly Newsletter",
			Subject:   "Your weekly update from Acme Corp",
			Body:      "Hi {{name}},\n\nHere's what happened this week at Acme Corp:\n\n• Product updates\n• Industry news\n• Tips & tricks\n\nSee you next week!\nThe Acme Team",
			Recipient: "all-contacts",
			Frequency: "weekly",
			SendTime:  "08:00",
			DayOfWeek: "monday",
			Status:    "active",
			CreatedAt: now.AddDate(0, -1, 0),
			UpdatedAt: now.AddDate(0, -1, 0),
		},
		{
			ID:         models.NewUUID(),
			Name:       "Monthly Check-in",
			Subject:    "Checking in — how can we help?",
			Body:       "Hi {{name}},\n\nIt's been a month since we last connected. We'd love to hear how things are going and see if there's anything we can do to support you.\n\nReply to this email or book a call at your convenience.\n\nCheers,\nAlice Admin",
			Recipient:  "qualified-leads",
			Frequency:  "monthly",
			SendTime:   "10:00",
			DayOfMonth: "1",
			Status:     "active",
			CreatedAt:  now.AddDate(0, -2, 0),
			UpdatedAt:  now.AddDate(0, -2, 0),
		},
		{
			ID:        models.NewUUID(),
			Name:      "Follow-up After Demo",
			Subject:   "Thanks for joining our demo!",
			Body:      "Hi {{name}},\n\nThank you for taking the time to join our product demo. I hope it gave you a clear picture of what Acme Corp can do for your team.\n\nNext steps:\n1. Review the proposal I've attached\n2. Share with your team\n3. Let's schedule a follow-up call\n\nLooking forward to working with you!\nMark Manager",
			Recipient: "demo-attendees",
			Frequency: "one-time",
			SendDate:  now.AddDate(0, 0, 2).Format("2006-01-02"),
			SendTime:  "14:00",
			Status:    "draft",
			CreatedAt: now.AddDate(0, 0, -3),
			UpdatedAt: now.AddDate(0, 0, -1),
		},
		{
			ID:        models.NewUUID(),
			Name:      "Re-engagement Campaign",
			Subject:   "We miss you — here's 20% off",
			Body:      "Hi {{name}},\n\nWe noticed you haven't been active recently and we'd love to win you back.\n\nUse code COMEBACK20 for 20% off your next renewal.\n\nOffer expires in 7 days.\n\nThe Acme Team",
			Recipient: "inactive-contacts",
			Frequency: "one-time",
			SendDate:  now.AddDate(0, 0, 5).Format("2006-01-02"),
			SendTime:  "11:00",
			Status:    "paused",
			CreatedAt: now.AddDate(0, -3, 0),
			UpdatedAt: now.AddDate(0, 0, -7),
		},
	}
	must(db.DB.Create(&emailTemplates).Error)

	// ── Deals (linked to contacts) ────────────────────────────────────────────
	closeIn := func(days int) *time.Time { t := now.AddDate(0, 0, days); return &t }

	deals := []models.Deal{
		{
			ID: models.NewUUID(), Title: "Globex Enterprise License",
			ContactID: tomID, ContactName: "Tom Cruise",
			Value: 48000, Currency: "USD", Stage: "proposal",
			AssignedTo: "Alice Admin", ExpectedClose: closeIn(14),
			CreatedAt: now.AddDate(0, -1, 0), UpdatedAt: now.AddDate(0, 0, -2),
		},
		{
			ID: models.NewUUID(), Title: "Globex Add-on Seats",
			ContactID: tomID, ContactName: "Tom Cruise",
			Value: 8500, Currency: "USD", Stage: "negotiation",
			AssignedTo: "Mark Manager", ExpectedClose: closeIn(7),
			CreatedAt: now.AddDate(0, 0, -10), UpdatedAt: now.AddDate(0, 0, -1),
		},
		{
			ID: models.NewUUID(), Title: "Initech Pilot Program",
			ContactID: janeID, ContactName: "Jane Foster",
			Value: 12000, Currency: "USD", Stage: "lead",
			AssignedTo: "Mark Manager", ExpectedClose: closeIn(30),
			CreatedAt: now.AddDate(0, -2, 0), UpdatedAt: now.AddDate(0, 0, -5),
		},
		{
			ID: models.NewUUID(), Title: "Umbrella Corp Research Suite",
			ContactID: bruceID, ContactName: "Bruce Banner",
			Value: 75000, Currency: "USD", Stage: "negotiation",
			AssignedTo: "Alice Admin", ExpectedClose: closeIn(10),
			CreatedAt: now.AddDate(0, -3, 0), UpdatedAt: now.AddDate(0, 0, -1),
		},
		{
			ID: models.NewUUID(), Title: "Wayne Tech Platform Deal",
			ContactID: dianaID, ContactName: "Diana Prince",
			Value: 120000, Currency: "USD", Stage: "qualified",
			AssignedTo: "Alice Admin", ExpectedClose: closeIn(45),
			CreatedAt: now.AddDate(0, -1, -15), UpdatedAt: now,
		},
		{
			ID: models.NewUUID(), Title: "Wayne Tech Pro Support",
			ContactID: dianaID, ContactName: "Diana Prince",
			Value: 18000, Currency: "USD", Stage: "proposal",
			AssignedTo: "Mark Manager", ExpectedClose: closeIn(21),
			CreatedAt: now.AddDate(0, 0, -8), UpdatedAt: now.AddDate(0, 0, -2),
		},
		{
			ID: models.NewUUID(), Title: "Daily Bugle Media Package",
			ContactID: peterID, ContactName: "Peter Parker",
			Value: 3200, Currency: "USD", Stage: "lead",
			AssignedTo: "Sam Support", ExpectedClose: closeIn(60),
			CreatedAt: now.AddDate(0, -4, 0), UpdatedAt: now.AddDate(0, 0, -10),
		},
		{
			ID: models.NewUUID(), Title: "S.H.I.E.L.D Annual Contract",
			ContactID: natashaID, ContactName: "Natasha Romanoff",
			Value: 250000, Currency: "USD", Stage: "won",
			AssignedTo: "Alice Admin", ExpectedClose: closeIn(-5),
			CreatedAt: now.AddDate(0, -5, 0), UpdatedAt: now.AddDate(0, 0, -3),
		},
		{
			ID: models.NewUUID(), Title: "S.H.I.E.L.D Security Audit",
			ContactID: natashaID, ContactName: "Natasha Romanoff",
			Value: 32000, Currency: "USD", Stage: "won",
			AssignedTo: "Mark Manager", ExpectedClose: closeIn(-15),
			CreatedAt: now.AddDate(0, -6, 0), UpdatedAt: now.AddDate(0, -1, 0),
		},
		{
			ID: models.NewUUID(), Title: "Initech Cloud Migration",
			ContactID: janeID, ContactName: "Jane Foster",
			Value: 0, Currency: "USD", Stage: "lost",
			AssignedTo: "Sam Support", ExpectedClose: closeIn(-30),
			CreatedAt: now.AddDate(0, -3, 0), UpdatedAt: now.AddDate(0, -1, -5),
		},
	}
	must(db.DB.Create(&deals).Error)

	// ── Email Groups ──────────────────────────────────────────────────────────
	emailGroups := []models.EmailGroup{
		{
			ID:          models.NewUUID(),
			Name:        "new-clients",
			Description: "Contacts who recently signed up or onboarded",
			ContactIDs:  []string{tomID, janeID},
			CreatedAt:   now.AddDate(0, -3, 0),
			UpdatedAt:   now.AddDate(0, -3, 0),
		},
		{
			ID:          models.NewUUID(),
			Name:        "all-contacts",
			Description: "Every contact in the CRM",
			ContactIDs:  []string{tomID, janeID, bruceID, dianaID, peterID, natashaID},
			CreatedAt:   now.AddDate(0, -5, 0),
			UpdatedAt:   now.AddDate(0, -5, 0),
		},
		{
			ID:          models.NewUUID(),
			Name:        "qualified-leads",
			Description: "Contacts in qualified or openDeal status",
			ContactIDs:  []string{tomID, bruceID},
			CreatedAt:   now.AddDate(0, -2, 0),
			UpdatedAt:   now.AddDate(0, -2, 0),
		},
		{
			ID:          models.NewUUID(),
			Name:        "demo-attendees",
			Description: "Contacts who attended a product demo",
			ContactIDs:  []string{dianaID, bruceID, janeID},
			CreatedAt:   now.AddDate(0, -1, 0),
			UpdatedAt:   now.AddDate(0, -1, 0),
		},
		{
			ID:          models.NewUUID(),
			Name:        "inactive-contacts",
			Description: "Contacts with no activity in 30+ days",
			ContactIDs:  []string{peterID},
			CreatedAt:   now.AddDate(0, -4, 0),
			UpdatedAt:   now.AddDate(0, -4, 0),
		},
	}
	must(db.DB.Create(&emailGroups).Error)

	fmt.Println("✓ Demo data seeded successfully")
	fmt.Println("")
	fmt.Println("  Company : Acme Corp")
	fmt.Printf("  Users   : %d  (admin@acme.com / manager@acme.com / support@acme.com)\n", len(users))
	fmt.Printf("  Contacts: %d\n", len(contacts))
	fmt.Printf("  Tickets : %d\n", len(tickets))
	fmt.Println("  Projects: 2  (Website Redesign, CRM Onboarding)")
	fmt.Printf("  Email Templates: %d\n", len(emailTemplates))
	fmt.Printf("  Deals   : %d  (linked to contacts)\n", len(deals))
	fmt.Printf("  Email Groups: %d\n", len(emailGroups))
	fmt.Println("")
	fmt.Println("  Password for all accounts: admin123")
}

// ── helpers ───────────────────────────────────────────────────────────────────

func must(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

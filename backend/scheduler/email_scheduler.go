package scheduler

import (
	"log"
	"strings"
	"time"

	"tinycrm/db"
	"tinycrm/models"
	"tinycrm/services"
	"tinycrm/utils"
)

// Start launches the email scheduler goroutine. It ticks every minute and
// fires any active email templates and pending ad-hoc send jobs whose
// scheduled time matches now.
func Start() {
	go run()
}

func run() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()
	log.Println("Email scheduler started")
	for range ticker.C {
		processTemplates()
		processSendJobs()
	}
}

func processTemplates() {
	now := time.Now()
	today := now.Format("2006-01-02")
	currentTime := now.Format("15:04")
	currentWeekday := strings.ToLower(now.Weekday().String()) // e.g. "monday"
	currentDay := now.Format("2")                             // day of month without leading zero

	var templates []models.EmailTemplate
	if err := db.DB.Where("status = ?", "active").Find(&templates).Error; err != nil {
		log.Printf("Scheduler: failed to fetch templates: %v", err)
		return
	}

	for _, t := range templates {
		if !isDue(t, today, currentTime, currentWeekday, currentDay) {
			continue
		}

		// If the recipient field names an email group, its contacts are
		// real CRM contacts, so route through SendAndLog and record them in
		// the Sent Emails log. Otherwise treat it as raw comma-separated
		// addresses (legacy behavior) sent directly, with no contact to log
		// against.
		var group models.EmailGroup
		if err := db.DB.Where("name = ?", t.Recipient).First(&group).Error; err == nil && len(group.ContactIDs) > 0 {
			contacts, contactsErr := services.ResolveContacts(group.ContactIDs)
			if contactsErr != nil {
				log.Printf("Scheduler: template %q: failed to resolve group contacts: %v", t.Name, contactsErr)
			} else {
				groupID := group.ID
				services.SendAndLog(contacts, t.Subject, t.Body, "template", &t.ID, t.Name, "group", &groupID, group.Name, nil)
			}
		} else {
			for _, raw := range strings.Split(t.Recipient, ",") {
				email := strings.TrimSpace(raw)
				if email == "" {
					continue
				}
				go func(to string) {
					subject := services.RenderVars(t.Subject, "", to, "", "", today)
					body := utils.LexicalToHTML(services.RenderVars(t.Body, "", to, "", "", today))
					utils.SendEmail(to, subject, body)
					log.Printf("Scheduler: sent %q to %s", t.Name, to)
				}(email)
			}
		}

		// Mark one-time templates as sent so they don't fire again
		if t.Frequency == "one-time" {
			err := db.DB.Model(&models.EmailTemplate{}).Where("id = ?", t.ID).
				Updates(map[string]interface{}{"status": "sent", "updatedAt": time.Now()}).Error
			if err != nil {
				log.Printf("Scheduler: failed to mark template %q as sent: %v", t.Name, err)
			}
		}
	}
}

func isDue(t models.EmailTemplate, today, currentTime, currentWeekday, currentDay string) bool {
	if t.SendTime != currentTime {
		return false
	}
	switch t.Frequency {
	case "one-time":
		return t.SendDate == today
	case "daily":
		return true
	case "weekly":
		return strings.ToLower(t.DayOfWeek) == currentWeekday
	case "monthly":
		return t.DayOfMonth == currentDay
	}
	return false
}

// processSendJobs fires any pending ad-hoc "Send Email" jobs (one-time,
// scheduled for the future) whose send date/time has arrived.
func processSendJobs() {
	now := time.Now()
	today := now.Format("2006-01-02")
	currentTime := now.Format("15:04")

	var jobs []models.EmailSendJob
	if err := db.DB.Where("status = ?", "pending").Find(&jobs).Error; err != nil {
		log.Printf("Scheduler: failed to fetch email send jobs: %v", err)
		return
	}

	for _, j := range jobs {
		if j.SendDate != today || j.SendTime != currentTime {
			continue
		}

		var contacts []models.Contact
		var groupName string
		switch {
		case j.RecipientMode == "audience":
			cs, err := services.ResolveAudience(services.AudienceSelection{
				ContactIDs:    j.ContactIDs,
				GroupIDs:      j.GroupIDs,
				TagIDs:        j.TagIDs,
				TagMatch:      j.TagMatch,
				ExcludeTagIDs: j.ExcludeTagIDs,
			})
			if err != nil {
				log.Printf("Scheduler: send job %s: failed to resolve audience: %v", j.ID, err)
			} else {
				contacts = cs
				groupName = describeJobAudience(j)
			}
		case j.RecipientMode == "group" && j.GroupID != nil:
			cs, group, err := services.ResolveGroupContacts(*j.GroupID)
			if err != nil {
				log.Printf("Scheduler: send job %s: failed to resolve group: %v", j.ID, err)
			} else {
				contacts = cs
				groupName = group.Name
			}
		default:
			cs, err := services.ResolveContacts(j.ContactIDs)
			if err != nil {
				log.Printf("Scheduler: send job %s: failed to resolve contacts: %v", j.ID, err)
			} else {
				contacts = cs
			}
		}

		lead := &services.LeadDetails{
			Title:         j.LeadTitle,
			Value:         j.LeadValue,
			Currency:      j.LeadCurrency,
			AssignedTo:    j.LeadAssignedTo,
			ExpectedClose: j.LeadExpectedClose,
		}
		services.SendAndLog(contacts, j.Subject, j.Body, j.SourceType, j.SourceTemplateID, j.SourceTemplateName, j.RecipientMode, j.GroupID, groupName, lead)

		if err := db.DB.Model(&models.EmailSendJob{}).Where("id = ?", j.ID).
			Updates(map[string]interface{}{"status": "sent", "updatedAt": time.Now()}).Error; err != nil {
			log.Printf("Scheduler: failed to mark send job %s as sent: %v", j.ID, err)
		}
	}
}

// describeJobAudience builds a readable "Tags: …  ·  Groups: …" label for an
// audience-mode send job, for the EmailSend history row.
func describeJobAudience(j models.EmailSendJob) string {
	var tagNames []string
	if len(j.TagIDs) > 0 {
		var tags []models.Tag
		db.DB.Where("id IN ?", j.TagIDs).Find(&tags) //nolint
		for _, t := range tags {
			tagNames = append(tagNames, t.Name)
		}
	}
	var groupNames []string
	if len(j.GroupIDs) > 0 {
		var groups []models.EmailGroup
		db.DB.Where("id IN ?", j.GroupIDs).Find(&groups) //nolint
		for _, g := range groups {
			groupNames = append(groupNames, g.Name)
		}
	}
	sel := services.AudienceSelection{ContactIDs: j.ContactIDs, GroupIDs: j.GroupIDs, TagIDs: j.TagIDs}
	return services.DescribeAudience(sel, tagNames, groupNames)
}

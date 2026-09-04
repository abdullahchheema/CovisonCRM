package services

import (
	"tinycrm/db"
	"tinycrm/models"
)

// ContactIDsForTags resolves which contacts carry the given tags, under an
// "any" (at least one) or "all" (every one) match rule. Used by contact
// filtering, dynamic email groups, and audience resolution — the single
// place tag-membership rules are evaluated.
func ContactIDsForTags(tagIDs []string, match string) ([]string, error) {
	if len(tagIDs) == 0 {
		return nil, nil
	}

	if match == "all" {
		type row struct {
			ContactID string `gorm:"column:contactId"`
		}
		rows := make([]row, 0)
		err := db.DB.Model(&models.ContactTag{}).
			Select("contactId").
			Where("tagId IN ?", tagIDs).
			Group("contactId").
			Having("COUNT(DISTINCT tagId) = ?", len(tagIDs)).
			Find(&rows).Error
		if err != nil {
			return nil, err
		}
		ids := make([]string, len(rows))
		for i, r := range rows {
			ids[i] = r.ContactID
		}
		return ids, nil
	}

	// "any" (default)
	var ids []string
	err := db.DB.Model(&models.ContactTag{}).
		Distinct("contactId").
		Where("tagId IN ?", tagIDs).
		Pluck("contactId", &ids).Error
	return ids, err
}

// SyncContactTags replaces a contact's tag set with exactly tagIDs.
func SyncContactTags(contactID string, tagIDs []string) error {
	if err := db.DB.Where("contactId = ?", contactID).Delete(&models.ContactTag{}).Error; err != nil {
		return err
	}
	if len(tagIDs) == 0 {
		return nil
	}
	rows := make([]models.ContactTag, len(tagIDs))
	for i, tagID := range tagIDs {
		rows[i] = models.ContactTag{ContactID: contactID, TagID: tagID}
	}
	return db.DB.Create(&rows).Error
}

// AttachTags populates the transient Tags/TagIDs fields on each contact in
// one batched query, mirroring the "fetch related rows, group, attach"
// pattern used for project board stats.
func AttachTags(contacts []models.Contact) error {
	if len(contacts) == 0 {
		return nil
	}
	ids := make([]string, len(contacts))
	for i, c := range contacts {
		ids[i] = c.ID
	}

	type joined struct {
		ContactID string `gorm:"column:contactId"`
		models.Tag
	}
	rows := make([]joined, 0)
	err := db.DB.Table("contact_tags").
		Select("contact_tags.contactId, tags.id, tags.name, tags.color, tags.createdAt").
		Joins("JOIN tags ON tags.id = contact_tags.tagId").
		Where("contact_tags.contactId IN ?", ids).
		Find(&rows).Error
	if err != nil {
		return err
	}

	byContact := make(map[string][]models.Tag, len(contacts))
	for _, r := range rows {
		byContact[r.ContactID] = append(byContact[r.ContactID], r.Tag)
	}

	for i := range contacts {
		tags := byContact[contacts[i].ID]
		if tags == nil {
			tags = []models.Tag{}
		}
		contacts[i].Tags = tags
		tagIDs := make([]string, len(tags))
		for j, t := range tags {
			tagIDs[j] = t.ID
		}
		contacts[i].TagIDs = tagIDs
	}
	return nil
}

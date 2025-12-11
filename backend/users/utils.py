def capitalize_first_letter(string):
  return string.capitalize()


from django.contrib.auth.models import Group
from .models import FieldPermission

def has_field_permission(user, model, field_name, permission, obj=None):
  """
  Vérifie si un utilisateur a une permission sur un champ.
  """
  if user.is_superuser:
      return True

  # Récupérer le content_type du modèle
  from django.contrib.contenttypes.models import ContentType
  content_type = ContentType.objects.get_for_model(model)

  # Chercher une permission pour l'utilisateur
  user_perms = FieldPermission.objects.filter(
    user=user,
    content_type=content_type,
    field_name=field_name,
    permission=permission,
    object_id=obj.id if obj else None
  )
  if user_perms.exists():
    return True

  # Chercher une permission pour les groupes de l'utilisateur
  group_ids = user.groups.all().values_list('id', flat=True)
  group_perms = FieldPermission.objects.filter(
    group_id__in=group_ids,
    content_type=content_type,
    field_name=field_name,
    permission=permission,
    object_id=obj.id if obj else None
  )
  if group_perms.exists():
      return True

  # Si aucune permission spécifique à l'objet, chercher une permission au niveau du modèle (object_id vide)
  if obj:
    # Permission au niveau du modèle pour l'utilisateur
    user_model_perms = FieldPermission.objects.filter(
      user=user,
      content_type=content_type,
      field_name=field_name,
      permission=permission,
      object_id__isnull=True
    )
    if user_model_perms.exists():
      return True

    # Permission au niveau du modèle pour les groupes
    group_model_perms = FieldPermission.objects.filter(
      group_id__in=group_ids,
      content_type=content_type,
      field_name=field_name,
      permission=permission,
      object_id__isnull=True
    )
    if group_model_perms.exists():
      return True
  return False
def capitalize_first_letter(string):
  return string.capitalize()


from django.contrib.auth.models import Group
from django.db import models
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


def get_user_field_permissions(user, model, obj=None):
  """
  Retourne un dictionnaire avec les permissions read/write pour chaque champ.
  Format: {'field_name': {'read': True, 'write': False}, ...}
  """
  from django.contrib.contenttypes.models import ContentType

  if user.is_superuser:
    # Les superusers ont accès à tout
    all_fields = [f.name for f in model._meta.get_fields()]
    return {field: {'read': True, 'write': True} for field in all_fields}

  content_type = ContentType.objects.get_for_model(model)
  permissions = {}

  # Récupérer les permissions utilisateur
  user_perms = FieldPermission.objects.filter(
    user=user,
    content_type=content_type,
    object_id=obj.id if obj else None
  )

  # Récupérer les permissions des groupes
  group_ids = user.groups.all().values_list('id', flat=True)
  group_perms = FieldPermission.objects.filter(
    group_id__in=group_ids,
    content_type=content_type,
    object_id=obj.id if obj else None
  )

  # Si obj existe, récupérer aussi les permissions au niveau du modèle
  model_perms = []
  if obj:
    model_perms = FieldPermission.objects.filter(
      content_type=content_type,
      object_id__isnull=True
    ).filter(
      models.Q(user=user) | models.Q(group_id__in=group_ids)
    )

  # Combiner toutes les permissions
  all_perms = list(user_perms) + list(group_perms) + list(model_perms)

  for perm in all_perms:
    if perm.field_name not in permissions:
      permissions[perm.field_name] = {'read': False, 'write': False}

    if perm.permission == FieldPermission.PERM_READ:
      permissions[perm.field_name]['read'] = True
    elif perm.permission == FieldPermission.PERM_WRITE:
      permissions[perm.field_name]['write'] = True
      # Write implique généralement Read
      permissions[perm.field_name]['read'] = True

  return permissions


def get_readable_fields(user, model, obj=None):
  """
  Retourne la liste des champs que l'utilisateur peut lire.
  """
  perms = get_user_field_permissions(user, model, obj)
  return [field for field, perm in perms.items() if perm['read']]


def get_writable_fields(user, model, obj=None):
  """
  Retourne la liste des champs que l'utilisateur peut modifier.
  """
  perms = get_user_field_permissions(user, model, obj)
  return [field for field, perm in perms.items() if perm['write']]


def filter_fields_by_permission(user, model, data, obj=None, permission_type='read'):
  """
  Filtre un dictionnaire de données en fonction des permissions de l'utilisateur.

  Args:
    user: L'utilisateur
    model: Le modèle Django
    data: Dictionnaire de données à filtrer
    obj: Instance optionnelle pour les permissions au niveau objet
    permission_type: 'read' ou 'write'

  Returns:
    Dictionnaire filtré
  """
  if user.is_superuser:
    return data

  perms = get_user_field_permissions(user, model, obj)
  filtered_data = {}

  for field_name, value in data.items():
    field_perms = perms.get(field_name, {'read': False, 'write': False})
    if field_perms.get(permission_type, False):
      filtered_data[field_name] = value

  return filtered_data
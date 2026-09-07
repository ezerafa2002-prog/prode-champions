-- Sincronización periódica de Fixture, sin depender de que nadie tenga
-- la web abierta. Corré esto UNA VEZ desde el SQL Editor de tu proyecto
-- Supabase (no es parte de las migraciones porque necesita datos
-- propios de tu proyecto que yo no tengo: la project ref y la service
-- role key).
--
-- Reemplazá:
--   <PROJECT_REF>          → el ref de tu proyecto (ves la URL completa
--                             en Project Settings → API: https://<PROJECT_REF>.supabase.co)
--   <SERVICE_ROLE_KEY>     → Project Settings → API → service_role key
--                             (NUNCA la pongas en el frontend ni en git —
--                             esto vive solo acá, en un secret de Vault)
--
-- Frecuencia: cada 15 minutos. Si tu plan de API-Football es el free
-- (100 requests/día), 15 min = 96 corridas/día y cada corrida hace
-- entre 1 y 3 requests según cuántos partidos haya sin cerrar — puede
-- quedarte justo en días con muchos partidos en vivo simultáneos.
-- Si te pasás del límite, subí el intervalo a */30.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret('<SERVICE_ROLE_KEY>', 'ff_service_role_key');

select cron.schedule(
  'ff-sync-every-15-min',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/ff-sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'ff_service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Para desactivarlo más adelante:
-- select cron.unschedule('ff-sync-every-15-min');

-- Para ver las últimas corridas y si fallaron:
-- select * from cron.job_run_details order by start_time desc limit 20;
